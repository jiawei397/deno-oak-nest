// deno-lint-ignore-file no-explicit-any
import {
  blue,
  format,
  green,
  OriginRouter,
  red,
  Reflect,
  Status,
  STATUS_TEXT,
  yellow,
} from "../deps.ts";
import { checkByGuard } from "./guard.ts";
import {
  NestUseInterceptors,
  RouteItem,
  RouteMap,
  Type,
} from "./interfaces/mod.ts";
import { META_METHOD_KEY, META_PATH_KEY } from "./decorators/controller.ts";
import { Factory } from "./factorys/class.factory.ts";
import { transferParam } from "./params.ts";
import { Context } from "../deps.ts";
import { checkByInterceptors } from "./interceptor.ts";
import { checkEtag } from "./utils.ts";

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
        methodType: methodType.toLowerCase(),
        fn,
        instance,
        cls: Cls,
        methodName: item,
      };
    }).filter(Boolean) as RouteMap[];
}

export class Router extends OriginRouter {
  [x: string]: any
  apiPrefix = "";
  private _diabledGetComputeEtag = false;
  private routerArr: RouteItem[] = [];

  private globalInterceptors: NestUseInterceptors = [];

  setGlobalPrefix(apiPrefix: string) {
    this.apiPrefix = apiPrefix;
  }

  /** diable 304 get */
  disableGetComputeEtag() {
    this._diabledGetComputeEtag = true;
  }

  useGlobalInterceptors(...interceptors: NestUseInterceptors) {
    this.globalInterceptors.push(...interceptors);
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
    if (methodType === "get" && !this._diabledGetComputeEtag) { // if get method, then deal 304
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
        this[methodType](methodKey, async (context: Context) => {
          const originStatus = context.response.status; // 404
          const guardResult = await checkByGuard(instance, fn, context);
          if (!guardResult) {
            if (context.response.status === originStatus) {
              context.response.status = Status.Forbidden;
              context.response.body = STATUS_TEXT.get(Status.Forbidden);
            }
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
