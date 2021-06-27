import {
  blue,
  Context,
  format,
  green,
  join,
  red,
  Router,
  Status,
  yellow,
  Reflect,
} from "../deps.ts";
import {HttpException, UnauthorizedException} from "./exception.ts";
import {CanActivate} from "./interface.ts";

type Constructor = new (...args: any[]) => any;

const META_METHOD_KEY = "meta:method";
const META_PATH_KEY = "meta:path";
const META_GUARD_KEY = "meta:guard";

export const Controller = (path: string): ClassDecorator => {
  return target => {
    Reflect.defineMetadata(META_PATH_KEY, path, target);
  }
}

const overrideFnByGuard = function (
    guards: CanActivate[],
    target: any,
    fn: Function,
) {
  return async function (context: Context, ...args: any) {
    if (!guards || guards.length === 0) {
      return fn.call(target, context, ...args);
    }
    const unauthorizedStatus: number = Status.Unauthorized;
    try {
      for (const guard of guards) {
        let canActivate;
        if (typeof guard === "function") {
          canActivate = new (guard as any)().canActivate;
        } else {
          canActivate = guard.canActivate;
        }

        const result = await canActivate.call(guard, context);
        if (!result) {
          context.response.status = unauthorizedStatus;
          context.response.body = UnauthorizedException.name;
          return;
        }
      }
      return fn.call(target, context, ...args);
    } catch (e) {
      console.warn(yellow(e.message));
      console.debug(e);
      if (e instanceof HttpException) {
        context.response.status = e.status;
      } else {
        context.response.status = unauthorizedStatus;
      }
      context.response.body = e.message;
    }
  };
};

export function UseGuards(...guards: (CanActivate | Function)[]) {
  return function (
      target: any,
      property?: string,
      descriptor?: TypedPropertyDescriptor<any>,
  ) {
    if (property && descriptor?.value) {
      Reflect.defineMetadata(META_GUARD_KEY, guards, descriptor.value);
    } else {
      Reflect.defineMetadata(META_GUARD_KEY, guards, target.prototype);
    }
    return target;
  };
}

enum Methods {
  GET = "get",
  POST = "post",
  PUT = "put",
  DELETE = "delete",
  HEAD = 'head'
}

const createMappingDecorator = (method: Methods) => (path: string): MethodDecorator => {
  return (target, property, descriptor) => {
    Reflect.defineMetadata(META_PATH_KEY, path, descriptor.value);
    Reflect.defineMetadata(META_METHOD_KEY, method, descriptor.value);
  }
}

export const Get = createMappingDecorator(Methods.GET);
export const Post = createMappingDecorator(Methods.POST);
export const Delete = createMappingDecorator(Methods.DELETE);
export const Put = createMappingDecorator(Methods.PUT);
export const Head = createMappingDecorator(Methods.HEAD);

export interface RouteMap {
  route: string;
  method: string;
  fn: Function;
  methodName: string;
  instance: object;
  cls: Constructor;
}

function mapRoute(cls: Constructor) {
  const instance = new cls();
  const prototype = Object.getPrototypeOf(instance);
  return Object.getOwnPropertyNames(prototype)
      .map(item => {
        if (item === 'constructor') {
          return;
        }
        if (typeof prototype[item] !== 'function') {
          return;
        }
        const fn = prototype[item];
        const route = Reflect.getMetadata(META_PATH_KEY, fn);
        if (!route) {
          return;
        }
        const method = Reflect.getMetadata(META_METHOD_KEY, fn);
        return {
          route,
          method,
          fn,
          item,
          instance,
          cls
        }
      }).filter(Boolean);
};

// export function PathParam(paramName: string) {
//   return function (target: any, methodName: string, paramIndex: number) {
//     !target.$Meta && (target.$Meta = {});
//     target.$Meta[paramIndex] = paramName;
//   };
// }

class MyRouter extends Router {
  private apiPrefix: string = "";
  private routerMap = new Map();

  setGlobalPrefix(apiPrefix: string) {
    this.apiPrefix = apiPrefix;
  }

  add(Cls: Constructor) {
    const arr = mapRoute(Cls);
    const path = Reflect.getMetadata(META_PATH_KEY, Cls);
    const key = join("/", path);
    this.routerMap.set(key, arr);
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
    for (let [controllerPath, routeArr] of this.routerMap) {
      const modelPath = join("/", this.apiPrefix, controllerPath);
      const startTime = Date.now();
      let lastCls;
      routeArr.forEach((routeMap: RouteMap) => {
        const {route, method, fn, methodName, instance, cls} = routeMap;
        lastCls = cls;
        const methodKey = join(modelPath, "/", route);
        const funcStart = Date.now();
        const classGuards = Reflect.getMetadata(META_GUARD_KEY, instance) || []
        const fnGuards = Reflect.getMetadata(META_GUARD_KEY, fn) || [];

        const newFunc = overrideFnByGuard(classGuards.concat(fnGuards), instance, fn);
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
      const name = lastCls?.['name'];
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

export {MyRouter as Router};
