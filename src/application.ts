// deno-lint-ignore-file no-explicit-any
import {
  blue,
  Context,
  format,
  green,
  Hono,
  red,
  Reflect,
  serveStatic,
  Status,
  STATUS_TEXT,
  yellow,
} from "../deps.ts";
import {
  META_ALIAS_KEY,
  META_HEADER_KEY,
  META_HTTP_CODE_KEY,
  META_METHOD_KEY,
  META_PATH_KEY,
} from "./decorators/controller.ts";
import { Factory } from "./factorys/class.factory.ts";
import { checkByGuard } from "./guard.ts";
import { checkByInterceptors } from "./interceptor.ts";
import {
  ApiPrefixOptions,
  ListenOptions,
} from "./interfaces/application.interface.ts";
import { AliasOptions } from "./interfaces/controller.interface.ts";
import { StaticOptions } from "./interfaces/factory.interface.ts";
import { ControllerMethod } from "./interfaces/guard.interface.ts";
import { NestUseInterceptors } from "./interfaces/interceptor.interface.ts";
import {
  ErrorHandler,
  NestMiddleware,
  NotFoundHandler,
} from "./interfaces/middleware.interface.ts";
import { RouteItem, RouteMap } from "./interfaces/route.interface.ts";
import { Constructor, Type } from "./interfaces/type.interface.ts";
import { transferParam } from "./params.ts";
import { NestResponse } from "./response.ts";

export function join(...paths: string[]) {
  if (paths.length === 0) {
    return "";
  }
  const str = paths.join("/").replaceAll("///", "/").replaceAll("//", "/");
  let last = str;
  if (!last.startsWith("/")) {
    last = "/" + last;
  }
  if (last.endsWith("/")) {
    last = last.substring(0, last.length - 1);
  }
  return last;
}

export function replacePrefix(str: string, prefix: string) {
  return join(str.replace(/\$\{prefix\}/, prefix));
}

export function replaceSuffix(str: string, suffix: string) {
  return join(str.replace(/\$\{suffix\}/, suffix));
}

export function replaceController(str: string, suffix: string) {
  return join(str.replace(/\$\{controller\}/, suffix));
}

export function replacePrefixAndSuffix(
  str: string,
  prefix: string,
  suffix: string,
  controller?: string,
) {
  let temp = replacePrefix(str, prefix);
  if (controller) {
    temp = replaceController(temp, controller);
  }
  temp = replaceSuffix(temp, suffix);
  return temp;
}

export async function mapRoute(
  Cls: Type,
  cache?: Map<any, any>,
): Promise<RouteMap[]> {
  const instance = await Factory(Cls, undefined, cache);
  const prototype = Cls.prototype;
  const result: RouteMap[] = [];
  Object.getOwnPropertyNames(prototype)
    .forEach((item) => {
      if (item === "constructor") {
        return;
      }
      if (typeof prototype[item] !== "function") {
        return;
      }
      const fn = prototype[item];
      const methodPath = Reflect.getMetadata(META_PATH_KEY, fn);
      if (!methodPath) {
        return;
      }
      const methodType = Reflect.getMetadata(META_METHOD_KEY, fn);
      const aliasOptions: AliasOptions = Reflect.getMetadata(
        META_ALIAS_KEY,
        fn,
      );
      result.push({
        methodPath,
        aliasOptions,
        methodType: methodType.toLowerCase(),
        fn,
        instance,
        cls: Cls,
        methodName: item,
      });
    });
  return result;
}

export class Application {
  apiPrefix = "";
  apiPrefixOptions: ApiPrefixOptions = {};
  private globalInterceptors: NestUseInterceptors = [];
  staticOptions: StaticOptions;
  app: Hono;
  defaultCache: Map<any, any> | undefined;

  private routerArr: RouteItem[] = [];

  constructor() {
    this.app = new Hono();
  }

  get(path: string, middleware: NestMiddleware) {
    this.app.get(path, async (ctx: Context, next) => {
      const response = NestResponse.getNestResponseWithInit(ctx);
      const result = await middleware(ctx.req, response!, next);
      return this.renderResponse(ctx, result);
    });
  }

  setGlobalPrefix(apiPrefix: string, options: ApiPrefixOptions = {}) {
    this.apiPrefix = apiPrefix;
    this.apiPrefixOptions = options;
  }

  use(...middlewares: NestMiddleware[]) {
    middlewares.forEach((middleware) => {
      this.app.use("*", async (ctx: Context, next) => {
        const response = NestResponse.getNestResponseWithInit(ctx);
        const result = await middleware(ctx.req, response!, next);
        return this.renderResponse(ctx, result);
      });
    });
  }

  useGlobalInterceptors(...interceptors: NestUseInterceptors) {
    this.globalInterceptors.push(...interceptors);
  }

  /**
   * Sets a base directory for public assets.
   * @example
   * app.useStaticAssets('public')
   */
  useStaticAssets(
    path: string,
    options: StaticOptions = {},
  ) {
    this.staticOptions = {
      baseDir: path,
      ...options,
    };
  }

  listen(options?: ListenOptions) {
    this.routes();
    this.startView();
    return Deno.serve(options || { port: 8000 }, this.app.fetch);
  }

  onError(handler: ErrorHandler) {
    this.app.onError(async (err, ctx) => {
      const res = NestResponse.getNestResponseWithInit(ctx);
      const result = await handler(err, ctx.req, res);
      return this.renderResponse(ctx, result);
    });
  }

  notFound(handler: NotFoundHandler) {
    this.app.notFound(async (ctx) => {
      const res = NestResponse.getNestResponseWithInit(ctx);
      const result = await handler(ctx.req, res);
      return this.renderResponse(ctx, result);
    });
  }

  /**
   * start serve view and static assets.
   *
   * If has prefix either api or view of static assets, it will be served self without other check, so it`s a good idea to set prefix if you want to have a good performance.
   *
   * Then it will check the extension of the pathname, if it`s optioned such as `ejs`, it will be served view, otherwise it will be served static assets.
   *
   * But if there is index.html in the static assets, it will be served first before the view.
   */
  private startView() {
    if (!this.staticOptions) {
      return;
    }
    const prefix = this.staticOptions.prefix;
    const path = this.staticOptions.path ? `${this.staticOptions.path}/*` : "*";
    this.app.get(
      path,
      serveStatic({
        root: this.staticOptions.baseDir,
        rewriteRequestPath: (path) => prefix ? path.replace(prefix, "") : path,
      }),
    );
  }

  /**
   * add controller
   * @protected
   */
  async add(...clsArr: Type[]) {
    await Promise.all(clsArr.map(async (Cls) => {
      const find = this.routerArr.find(({ cls }) => cls === Cls);
      if (find) {
        return;
      }
      const arr = await mapRoute(Cls, this.defaultCache);
      const path = Reflect.getMetadata(META_PATH_KEY, Cls);
      const aliasOptions = Reflect.getMetadata(META_ALIAS_KEY, Cls);
      const controllerPath = join(path);
      this.routerArr.push({
        controllerPath,
        arr,
        cls: Cls,
        aliasOptions,
      });
    }));
    return this.routerArr;
  }

  private log(...message: string[]) {
    console.log(
      yellow("[router]"),
      green(format(new Date(), "yyyy-MM-dd HH:mm:ss")),
      ...message,
    );
  }

  private formatResponse(
    context: Context,
    options: {
      target: InstanceType<Constructor>;
      args: any[];
      methodName: string;
      methodType: string; // get/post/put/delete
      fn: ControllerMethod;
    },
  ) {
    // response headers
    const headers: Record<string, string> = Reflect.getMetadata(
      META_HEADER_KEY,
      options.fn,
    );
    if (headers) {
      Object.keys(headers).forEach((key) => {
        context.res.headers.set(key, headers[key]);
      });
    }

    // response http code
    const code: number = Reflect.getMetadata(
      META_HTTP_CODE_KEY,
      options.fn,
    );
    if (code) {
      context.status(code);
    }
  }

  private routes() {
    const routeStart = Date.now();
    // const result = super.routes();
    const apiPrefixReg = this.apiPrefixOptions?.exclude;

    this.routerArr.forEach(
      ({ controllerPath, arr, aliasOptions: controllerAliasOptions }) => {
        let isAbsolute = controllerAliasOptions?.isAbsolute;
        if (!isAbsolute && apiPrefixReg) {
          isAbsolute = apiPrefixReg.some((str) => {
            const reg = typeof str === "string" ? new RegExp(str) : str;
            return reg.test(controllerPath);
          });
        }
        let controllerPathWithPrefix = isAbsolute
          ? controllerPath
          : join(this.apiPrefix, controllerPath);
        controllerPathWithPrefix = replacePrefixAndSuffix(
          controllerPathWithPrefix,
          this.apiPrefix,
          controllerPath,
        );
        const controllerAliasPath = controllerAliasOptions?.alias &&
          replacePrefixAndSuffix(
            controllerAliasOptions.alias,
            this.apiPrefix,
            controllerPath,
          );
        const startTime = Date.now();
        let lastCls;
        arr.forEach((routeMap: RouteMap) => {
          const {
            methodPath,
            aliasOptions,
            methodType,
            fn,
            methodName,
            instance,
            cls,
          } = routeMap;
          lastCls = cls;
          const isAbsolute = aliasOptions?.isAbsolute;
          const alias = aliasOptions?.alias;
          const originPath = isAbsolute
            ? replacePrefix(methodPath, this.apiPrefix)
            : join(controllerPathWithPrefix, methodPath);
          let aliasPath = alias ??
            (controllerAliasPath && !isAbsolute &&
              join(controllerAliasPath, methodPath));
          const funcStart = Date.now();
          const callback = async (context: Context) => {
            // TODO: deal with useFilter
            try {
              const guardResult = await checkByGuard(instance, fn, context);
              if (!guardResult) {
                context.status(Status.Forbidden);
                return context.json({
                  message: STATUS_TEXT.get(Status.Forbidden),
                  statusCode: Status.Forbidden,
                });
              }
            } catch (error) {
              const status = typeof error.status === "number"
                ? error.status
                : Status.InternalServerError; // If the error is not HttpException, it will be 500
              return context.json({
                message: error.message || error,
                statusCode: status,
              });
            }

            const args = await transferParam(instance, methodName, context);
            const result = await checkByInterceptors(
              context,
              this.globalInterceptors,
              fn,
              {
                target: instance,
                methodName,
                methodType,
                args,
                fn,
              },
            );
            this.formatResponse(
              context,
              {
                fn,
                target: instance,
                methodType,
                args,
                methodName,
              },
            );
            // console.log(context.res.body, result);
            return this.renderResponse(context, result);
          };
          (this.app as any)[methodType](originPath, callback);

          if (aliasPath) {
            aliasPath = replacePrefixAndSuffix(
              aliasPath,
              this.apiPrefix,
              methodPath,
              controllerPath,
            );
            (this.app as any)[methodType](aliasPath, callback);
          }
          const funcEnd = Date.now();
          this.log(
            yellow("[RouterExplorer]"),
            green(
              `Mapped {${
                aliasPath
                  ? (originPath + ", " + red(aliasPath))
                  : (isAbsolute ? red(originPath) : originPath)
              }, ${methodType.toUpperCase()}} route ${
                funcEnd -
                funcStart
              }ms`,
            ),
          );
        });

        const endTime = Date.now();
        const name = lastCls?.["name"];
        this.log(
          red("[RoutesResolver]"),
          blue(
            `${name} {${controllerPathWithPrefix}} ${endTime - startTime}ms`,
          ),
        );
      },
    );
    this.log(
      yellow("[Routes application]"),
      green(`successfully started ${Date.now() - routeStart}ms`),
    );
    // return result;
  }

  private renderResponse(context: Context, result: unknown) {
    if (result instanceof Response) {
      return result;
    }
    if (result instanceof ReadableStream) {
      return new Response(result);
    }
    const render = (body: any) => {
      const contextType = context.res.headers.get("content-type");
      if (
        (contextType && contextType.includes("application/json")) ||
        (body && typeof body !== "string")
      ) {
        return context.json(body);
      }
      if (contextType && contextType.includes("text/html")) {
        return context.html(body);
      }
      return context.text(body);
    };

    const nestResponse = NestResponse.getNestResponse(context);
    if (nestResponse) {
      context.status(nestResponse.status ?? 200);
      nestResponse.headers.forEach((key, value) => {
        context.header(key, value);
      });
      // console.log(nestResponse.body);
      return render(nestResponse.body ?? result);
    } else {
      return render(result);
    }
  }
}
