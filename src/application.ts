// deno-lint-ignore-file no-explicit-any
import {
  blue,
  format,
  green,
  red,
  Reflect,
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
import {
  ForbiddenException,
  HttpException,
  InternalServerErrorException,
} from "./exceptions.ts";
import { Factory } from "./factorys/class.factory.ts";
import { checkByFilters } from "./filter.ts";
import { checkByGuard } from "./guard.ts";
import { checkByInterceptors } from "./interceptor.ts";
import {
  ApiPrefixOptions,
  ListenOptions,
} from "./interfaces/application.interface.ts";
import { Context } from "./interfaces/context.interface.ts";
import { AliasOptions } from "./interfaces/controller.interface.ts";
import { StaticOptions } from "./interfaces/factory.interface.ts";
import { ExceptionFilters } from "./interfaces/filter.interface.ts";
import { ControllerMethod, NestGuards } from "./interfaces/guard.interface.ts";
import { NestUseInterceptors } from "./interfaces/interceptor.interface.ts";
import { NestMiddleware } from "./interfaces/middleware.interface.ts";
import { IRouter, RouteItem, RouteMap } from "./interfaces/route.interface.ts";
import { Constructor, Type } from "./interfaces/type.interface.ts";
import { transferParam } from "./params.ts";

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
  private globalExceptionFilters: ExceptionFilters = [];
  private globalGuards: NestGuards = [];
  staticOptions: StaticOptions;
  defaultCache: Map<any, any> | undefined;

  private routerArr: RouteItem[] = [];

  constructor(protected router: IRouter) {}

  setGlobalPrefix(apiPrefix: string, options: ApiPrefixOptions = {}) {
    this.apiPrefix = apiPrefix;
    this.apiPrefixOptions = options;
  }

  get(path: string, middleware: NestMiddleware) {
    this.router.get(path, async (ctx, next) => {
      await middleware(ctx.request, ctx.response, next);
    });
  }

  use(...middlewares: NestMiddleware[]): void {
    middlewares.forEach((middleware) => {
      this.router.use(async (ctx, next) => {
        await middleware(ctx.request, ctx.response, next);
      });
    });
  }

  /**
   * @param options
   * @returns
   */
  listen(options?: ListenOptions): void {
    this.routes();
    this.router.routes();
    this.router.serveForStatic(this.staticOptions);
    return this.router.startServer(options);
  }

  useGlobalInterceptors(...interceptors: NestUseInterceptors) {
    this.globalInterceptors.push(...interceptors);
  }

  useGlobalFilters(...filters: ExceptionFilters) {
    this.globalExceptionFilters.push(...filters);
  }

  useGlobalGuards(...guards: NestGuards) {
    this.globalGuards.push(...guards);
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

  private async formatResponse(
    context: Context,
    options: {
      target: InstanceType<Constructor>;
      args: any[];
      methodName: string;
      methodType: string; // get/post/put/delete
      fn: ControllerMethod;
    },
  ) {
    // format response body
    if (context.response.status === 304) {
      context.response.body = null;
    } else if (context.response.body !== undefined) {
      const body = context.response.body;
      if (body instanceof Promise) {
        context.response.body = await body;
      }
    }

    // response headers
    const headers: Record<string, string> = Reflect.getMetadata(
      META_HEADER_KEY,
      options.fn,
    );
    if (headers) {
      Object.keys(headers).forEach((key) => {
        context.response.headers.set(key, headers[key]);
      });
    }

    // response http code
    const code: number = Reflect.getMetadata(
      META_HTTP_CODE_KEY,
      options.fn,
    );
    if (code) {
      context.response.status = code;
    }
  }

  private async validateGuard(
    target: InstanceType<Constructor>,
    fn: ControllerMethod,
    context: Context,
  ): Promise<boolean> {
    try {
      const originStatus = context.response.status;
      const passed = await checkByGuard(
        target,
        fn,
        context,
        this.globalGuards,
      );
      if (!passed) {
        if (context.response.status === originStatus) {
          context.response.status = Status.Forbidden;
        }
        if (!context.response.body) {
          context.response.body = new ForbiddenException("").response;
        }
        return false;
      }
      return true;
    } catch (error) {
      this.catchError(context, error);
      return false;
    }
  }

  private async catchFilter(
    target: InstanceType<Constructor>,
    fn: ControllerMethod,
    context: Context,
    error: any,
  ) {
    await checkByFilters(
      context,
      target,
      this.globalExceptionFilters,
      fn,
      error,
    ).catch((err) => this.catchError(context, err));
  }

  private catchError(context: Context, error: any) {
    const err = error instanceof HttpException
      ? error
      : new InternalServerErrorException(error.message || error);
    context.response.status = err.status;
    context.response.body = err.response;
  }

  protected routes() {
    const routeStart = Date.now();
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
            // validate guard
            if (await this.validateGuard(instance, fn, context) === false) {
              return;
            }

            // transfer params
            let args: any[];
            try {
              args = await transferParam(instance, methodName, context);
            } catch (error) {
              await this.catchFilter(instance, fn, context, error);
              return;
            }

            // call controller method
            try {
              const next = async () => {
                const result = await fn.apply(instance, args);
                if (
                  result !== undefined && context.response.body === undefined
                ) {
                  context.response.body = result;
                }
                return result;
              };
              await checkByInterceptors(
                context,
                this.globalInterceptors,
                fn,
                {
                  target: instance,
                  methodName,
                  methodType,
                  args,
                  fn,
                  next,
                },
              );
            } catch (error) {
              await this.catchFilter(instance, fn, context, error);
            }

            await this.formatResponse(
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
          };
          this.router[methodType](originPath, callback);

          if (aliasPath) {
            aliasPath = replacePrefixAndSuffix(
              aliasPath,
              this.apiPrefix,
              methodPath,
              controllerPath,
            );
            this.router[methodType](aliasPath, callback);
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
  }
}
