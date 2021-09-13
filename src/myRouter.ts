import {
  blue,
  format,
  green,
  red,
  Reflect,
  OriginRouter,
  yellow,
  join,
} from "../deps.ts";
import { Constructor, RouteMap } from "./interface.ts";
import {
  mapRoute,
  META_GUARD_KEY,
  META_PATH_KEY,
  overrideFnByGuard,
} from "./utils.ts";

class Router extends OriginRouter {
  private apiPrefix = "";
  private routerMap = new Map();

  setGlobalPrefix(apiPrefix: string) {
    this.apiPrefix = apiPrefix;
  }

  add(Cls: Constructor) {
    const arr = mapRoute(Cls);
    const path = Reflect.getMetadata(META_PATH_KEY, Cls);
    const key = join('/', path);
    const oldArr = this.routerMap.get(key);
    if (oldArr) {
      oldArr.push(...arr);
    } else {
      this.routerMap.set(key, arr);
    }
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
    for (const [controllerPath, routeArr] of this.routerMap) {
      const modelPath = join('/', this.apiPrefix, controllerPath);
      const startTime = Date.now();
      let lastCls;
      routeArr.forEach((routeMap: RouteMap) => {
        const { route, method, fn, methodName, instance, cls } = routeMap;
        lastCls = cls;
        const methodKey = join(modelPath, route);
        const funcStart = Date.now();
        const classGuards = Reflect.getMetadata(META_GUARD_KEY, instance) || [];
        const fnGuards = Reflect.getMetadata(META_GUARD_KEY, fn) || [];

        const newFunc = overrideFnByGuard(
          classGuards.concat(fnGuards),
          instance,
          fn,
          methodName,
        );
        // @ts-ignore
        this[method.toLowerCase()](methodKey, newFunc);
        const funcEnd = Date.now();
        this.log(
          yellow("[RouterExplorer]"),
          green(
            `Mapped {${methodKey}, ${method.toUpperCase()}} route ${funcEnd -
            funcStart}ms`,
          ),
        );
      });

      const endTime = Date.now();
      const name = lastCls?.["name"];
      this.log(
        red("[RoutesResolver]"),
        blue(`${name} {${modelPath}} ${endTime - startTime}ms`),
      );
    }
    this.log(
      yellow("[Routes application]"),
      green(`successfully started ${Date.now() - routeStart}ms`),
    );
    return result;
  }
}

export { Router };
