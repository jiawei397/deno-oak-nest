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
import { overrideFnByGuard } from "./guard.ts";
import { RouteMap, Type } from "./interfaces/mod.ts";
import { mapRoute, META_PATH_KEY } from "./utils.ts";

class Router extends OriginRouter {
  private apiPrefix = "";
  private routerArr: {
    controllerPath: string;
    arr: any[];
  }[] = [];

  setGlobalPrefix(apiPrefix: string) {
    this.apiPrefix = apiPrefix;
  }

  join(...paths: string[]) {
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

  add(...clsArr: Type[]) {
    return Promise.all(clsArr.map(async (Cls) => {
      const arr = await mapRoute(Cls);
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

  routes() {
    const routeStart = Date.now();
    const result = super.routes();
    this.routerArr.forEach(({ controllerPath, arr }) => {
      const modelPath = this.join(this.apiPrefix, controllerPath);
      const startTime = Date.now();
      let lastCls;
      arr.forEach((routeMap: RouteMap) => {
        const { route, method, fn, methodName, instance, cls } = routeMap;
        lastCls = cls;
        const methodKey = this.join(modelPath, route);
        const funcStart = Date.now();
        const newFunc = overrideFnByGuard(
          instance,
          fn,
          methodName,
        );
        // deno-lint-ignore ban-ts-comment
        // @ts-ignore
        this[method.toLowerCase()](methodKey, newFunc);
        const funcEnd = Date.now();
        this.log(
          yellow("[RouterExplorer]"),
          green(
            `Mapped {${methodKey}, ${method.toUpperCase()}} route ${
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
