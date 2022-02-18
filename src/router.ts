// deno-lint-ignore-file no-explicit-any
import {
  blue,
  extname,
  format,
  green,
  gzip,
  OriginRouter,
  red,
  Reflect,
  resolve,
  send,
  Status,
  STATUS_TEXT,
  yellow,
} from "../deps.ts";
import { checkByGuard } from "./guard.ts";
import {
  GzipOptions,
  NestUseInterceptors,
  RouteItem,
  RouteMap,
  ServeStaticOptions,
  Type,
} from "./interfaces/mod.ts";
import { META_METHOD_KEY, META_PATH_KEY } from "./decorators/controller.ts";
import { Factory } from "./factorys/class.factory.ts";
import { transferParam } from "./params.ts";
import { Context } from "../deps.ts";
import { checkByInterceptors } from "./interceptor.ts";
import { checkEtag } from "./utils.ts";

const defaultGzipOptions: GzipOptions = {
  extensions: [".js", ".css", ".wasm"],
  threshold: 1024 * 10, // 10kb
  level: 5,
};

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

export async function mapRoute(Cls: Type): Promise<RouteMap[]> {
  const instance = await Factory(Cls);
  const prototype = Cls.prototype;
  return Object.getOwnPropertyNames(prototype)
    .map((item) => {
      if (item === "constructor") {
        return;
      }
      if (typeof prototype[item] !== "function") {
        return;
      }
      const fn = prototype[item];
      const route = Reflect.getMetadata(META_PATH_KEY, fn);
      if (!route) {
        return;
      }
      const methodType = Reflect.getMetadata(META_METHOD_KEY, fn);
      return {
        route,
        methodType,
        fn,
        instance,
        cls: Cls,
        methodName: item,
      };
    }).filter(Boolean) as RouteMap[];
}

export class Router extends OriginRouter {
  [x: string]: any
  private apiPrefix = "";
  private routerArr: RouteItem[] = [];

  private globalInterceptors: NestUseInterceptors = [];

  setGlobalPrefix(apiPrefix: string) {
    this.apiPrefix = apiPrefix;
    return this;
  }

  useGlobalInterceptors(...interceptors: NestUseInterceptors) {
    this.globalInterceptors.push(...interceptors);
    return this;
  }

  /**
   * Sets a base directory for public assets.
   * @example
   * app.useStaticAssets('public')
   */
  useStaticAssets(
    path: string,
    options: ServeStaticOptions = {},
  ) {
    const { prefix = "/", gzip: _gzip, useOriginGzip, ...otherOptions } =
      options;
    const prefixWithoutSlash = join(prefix);
    const root = resolve(Deno.cwd(), path);
    const index = options?.index || "index.html";
    this.get(prefixWithoutSlash, (context) => {
      const pathname = context.request.url.pathname;
      if (!pathname.endsWith("/")) {
        const response = context.response;
        response.status = 301;
        response.redirect(pathname + "/");
        return;
      }
      return send(context, "", {
        ...otherOptions,
        index,
        root,
      });
    })
      .get(prefixWithoutSlash + "/:id", async (context) => {
        const pathname = context.request.url.pathname; //static/1.js
        const formattedPath = pathname.substring(prefixWithoutSlash.length + 1);
        const sendFile = () =>
          send(context, formattedPath, {
            ...otherOptions,
            index,
            root,
            gzip: useOriginGzip || false,
          });
        if (useOriginGzip) {
          return sendFile();
        }
        let canGzip = !!_gzip;
        if (_gzip) {
          let extensions: string[] = defaultGzipOptions.extensions!;
          if (typeof _gzip !== "boolean") {
            if (Array.isArray(_gzip.extensions)) {
              extensions = _gzip.extensions;
            }
          }
          canGzip = extensions.includes(extname(pathname));
        }
        if (!canGzip) {
          return sendFile();
        }
        const gzipOptions = typeof _gzip === "boolean"
          ? defaultGzipOptions
          : Object.assign({}, defaultGzipOptions, _gzip!);
        const realFilePath = resolve(
          Deno.cwd(),
          path,
          formattedPath,
        );
        const gzipPath = realFilePath + ".gz";
        const fileContent = await Deno.readFile(gzipPath).catch(() => {});
        if (fileContent) {
          context.response.body = fileContent;
        } else {
          const fileContent = await Deno.readFile(realFilePath).catch(() => {});
          if (!fileContent) {
            context.response.status = 404;
            context.response.body = "not found";
            return;
          }
          if (gzipOptions.filter && !gzipOptions.filter(context, fileContent)) {
            return sendFile();
          }
          if (fileContent.length < gzipOptions.threshold!) {
            // console.debug(
            //   "File is too small to gzip",
            //   realFilePath,
            //   fileContent.length,
            //   gzipOptions.threshold,
            // );
            return sendFile();
          }
          const gzipContent = gzip(fileContent, gzipOptions.level);
          context.response.body = gzipContent;
          const status = await Deno.permissions.query({ name: "write" });
          if (status.state === "granted") {
            Deno.writeFile(gzipPath, gzipContent).then(() => {
              console.info(`${blue("write gzip file success")} [${gzipPath}]`);
            }).catch(console.error);
          } else {
            console.warn(`${yellow("write gzip file denied")} [${gzipPath}]`);
          }
        }
        context.response.headers.set("Content-Encoding", "gzip");
        context.response.headers.delete("Content-Length");
      });
    return this;
  }

  async add(...clsArr: Type[]) {
    await Promise.all(clsArr.map(async (Cls) => {
      const find = this.routerArr.find(({ cls }) => cls === Cls);
      if (find) {
        return;
      }
      const arr = await mapRoute(Cls);
      const path = Reflect.getMetadata(META_PATH_KEY, Cls);
      const controllerPath = join(path);
      const item = {
        controllerPath,
        arr,
        cls: Cls,
      };
      this.routerArr.push(item);
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

  private async transResponseResult(
    context: Context,
    result: any,
    methodType: string,
  ) {
    if (context.response.status === 304) {
      context.response.body = undefined;
      return;
    }
    if (methodType === "get") { // if get method, then deal 304
      await checkEtag(context, result);
    } else if (context.response.body === undefined) {
      context.response.body = result;
    }
  }

  routes() {
    const routeStart = Date.now();
    const result = super.routes();
    this.routerArr.forEach(({ controllerPath, arr }) => {
      const modelPath = join(this.apiPrefix, controllerPath);
      const startTime = Date.now();
      let lastCls;
      arr.forEach((routeMap: RouteMap) => {
        const { route, methodType, fn, methodName, instance, cls } = routeMap;
        lastCls = cls;
        const methodKey = join(modelPath, route);
        const funcStart = Date.now();
        this[methodType.toLowerCase()](methodKey, async (context: Context) => {
          const guardResult = await checkByGuard(instance, fn, context);
          if (!guardResult) {
            context.response.status = Status.Forbidden;
            context.response.body = STATUS_TEXT.get(Status.Forbidden);
            return;
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
          await this.transResponseResult(
            context,
            context.response.body ?? result,
            methodType.toLowerCase(),
          );
        });
        const funcEnd = Date.now();
        this.log(
          yellow("[RouterExplorer]"),
          green(
            `Mapped {${methodKey}, ${methodType.toUpperCase()}} route ${
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
        blue(`${name} {${modelPath}} ${endTime - startTime}ms`),
      );
    });
    this.log(
      yellow("[Routes application]"),
      green(`successfully started ${Date.now() - routeStart}ms`),
    );
    return result;
  }
}
