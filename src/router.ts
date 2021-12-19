// deno-lint-ignore-file no-explicit-any
import {
  blue,
  format,
  green,
  OriginRouter,
  red,
  Reflect,
  yellow,
} from "../deps.ts";
import { checkByGuard } from "./guard.ts";
import { NestUseInterceptors, RouteMap, Type } from "./interfaces/mod.ts";
import { META_METHOD_KEY, META_PATH_KEY } from "./decorators/controller.ts";
import { Factory } from "./factorys/class.factory.ts";
import { transferParam } from "./params.ts";
import { Context } from "../deps.ts";
import { checkByInterceptors } from "./interceptor.ts";

class Router extends OriginRouter {
  [x: string]: any
  private apiPrefix = "";
  private routerArr: {
    controllerPath: string;
    arr: any[];
  }[] = [];

  private globalInterceptors: NestUseInterceptors = [];

  setGlobalPrefix(apiPrefix: string) {
    this.apiPrefix = apiPrefix;
  }

  useGlobalInterceptors(...interceptors: NestUseInterceptors) {
    this.globalInterceptors.push(...interceptors);
  }

  private join(...paths: string[]) {
    if (paths.length === 0) {
      return "";
    }
    const str = paths.join("/").replaceAll("///", "/").replaceAll("//", "/");
    let last = str;
    if (!last.startsWith("/")) {
      last = "/" + last;
    }
    if (last.endsWith("/")) {
      last = last.substr(0, last.length - 1);
    }
    return last;
  }

  private async mapRoute(Cls: Type) {
    const instance = await Factory(Cls);
    const prototype = Object.getPrototypeOf(instance);
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
          item,
          instance,
          cls: Cls,
          methodName: item,
        };
      }).filter(Boolean);
  }

  add(...clsArr: Type[]) {
    return Promise.all(clsArr.map(async (Cls) => {
      const arr = await this.mapRoute(Cls);
      const path = Reflect.getMetadata(META_PATH_KEY, Cls);
      const controllerPath = this.join(path);
      this.routerArr.push({
        controllerPath,
        arr,
      });
    }));
  }

  private log(...message: string[]) {
    console.log(
      yellow("[router]"),
      green(format(new Date(), "yyyy-MM-dd HH:mm:ss")),
      ...message,
    );
  }

  private transResponseResult(context: Context, result: any) {
    if (context.response.body === undefined) {
      context.response.body = result;
    }
  }

  routes() {
    const routeStart = Date.now();
    const result = super.routes();
    this.routerArr.forEach(({ controllerPath, arr }) => {
      const modelPath = this.join(this.apiPrefix, controllerPath);
      const startTime = Date.now();
      let lastCls;
      arr.forEach((routeMap: RouteMap) => {
        const { route, methodType, fn, methodName, instance, cls } = routeMap;
        lastCls = cls;
        const methodKey = this.join(modelPath, route);
        const funcStart = Date.now();
        this[methodType.toLowerCase()](methodKey, async (context: Context) => {
          await checkByGuard(instance, fn, context);
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
          this.transResponseResult(context, result);
          return result;
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

export { Router };
