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
} from "../deps.ts";
import { HttpException, UnauthorizedException } from "./exception.ts";
import { CanActivate } from "./interface.ts";

const META_MAP_KEY = "__META_MAP__";
const META_PATH_KEY = "__META_PATH__";
const META_GUARD_KEY = "__META_GUARD__";
const META_SCOPE_KEY = "__META_SCOPE__";

export function Controller(path: string): ClassDecorator {
  return function (target: any) {
    target[META_PATH_KEY] = path || "/";
    return target;
  };
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
    // console.log(target, property, descriptor);
    if (property && descriptor?.value) {
      descriptor.value[META_GUARD_KEY] = guards;
    } else {
      target[META_GUARD_KEY] = guards;
    }
    return target;
  };
}

enum Methods {
  GET = "get",
  POST = "post",
  PUT = "put",
  DELETE = "delete",
}

function allDecorator(path: string, method: Methods) {
  return (target: any, property: string, descriptor: any) => {
    const fn = descriptor.value || descriptor[property];
    // console.log('fn', fn, target, property);
    fn[META_SCOPE_KEY] = target;
    if (!target.constructor[META_MAP_KEY]) {
      target.constructor[META_MAP_KEY] = new Map();
    }
    const map = target.constructor[META_MAP_KEY];
    let getMap = map.get(method);
    if (!getMap) {
      getMap = new Map();
      map.set(method, getMap);
    }
    getMap.set(path, fn);
    return descriptor;
  };
}

export function Get(path: string) {
  return allDecorator(path, Methods.GET);
}

export function Post(path: string) {
  return allDecorator(path, Methods.POST);
}

export function Delete(path: string) {
  return allDecorator(path, Methods.DELETE);
}

export function Put(path: string) {
  return allDecorator(path, Methods.PUT);
}

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

  add(model: any) {
    const key = join("/", model[META_PATH_KEY]);
    this.routerMap.set(key, model);
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
    for (let [controllerPath, model] of this.routerMap) {
      const modelPath = join("/", this.apiPrefix, controllerPath);
      const startTime = Date.now();
      for (let [method, map] of model[META_MAP_KEY]) {
        for (let [key, func] of map) {
          const methodKey = join(modelPath, "/", key);
          const funcStart = Date.now();
          // console.log(dir, func);
          const guards = (model[META_GUARD_KEY] || []).concat(
            func[META_GUARD_KEY] || [],
          );
          const newFunc = overrideFnByGuard(guards, func[META_SCOPE_KEY], func);
          // @ts-ignore
          this[method](methodKey, newFunc);
          const funcEnd = Date.now();
          this.log(
            yellow("[RouterExplorer]"),
            green(
              `Mapped {${methodKey}, ${method.toUpperCase()}} route ${funcEnd -
                funcStart}ms`,
            ),
          );
        }
      }
      const endTime = Date.now();
      this.log(
        red("[RoutesResolver]"),
        blue(`${model.name} {${modelPath}} ${endTime - startTime}ms`),
      );
    }
    this.log(
      yellow("[Routes application]"),
      green(`successfully started ${Date.now() - routeStart}ms`),
    );
    return result;
  }
}

export { MyRouter as Router };
