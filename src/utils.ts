import { Context, Reflect, Status, yellow } from "../deps.ts";
import { HttpException, UnauthorizedException } from "./exception.ts";
import { CanActivate, Constructor, ControllerMethod } from "./interface.ts";
import { transferParam } from "./params.ts";

export const META_METHOD_KEY = Symbol("meta:method");
export const META_PATH_KEY = Symbol("meta:path");
export const META_GUARD_KEY = Symbol("meta:guard");

export const Controller = (path: string): ClassDecorator => {
  return (target) => {
    Reflect.defineMetadata(META_PATH_KEY, path, target);
  };
};

export function overrideFnByGuard(
  guards: CanActivate[],
  target: any,
  fn: ControllerMethod,
  methodName: string,
) {
  return async function (...args: any[]) {
    const context: Context = args[0];
    if (!guards || guards.length === 0) {
      await transferParam(target, methodName, args);
      return fn.apply(target, args);
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
      await transferParam(target, methodName, args);
      return fn.call(target, ...args);
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
}

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

export enum Methods {
  GET = "get",
  POST = "post",
  PUT = "put",
  DELETE = "delete",
  HEAD = "head",
}

const createMappingDecorator = (method: Methods) =>
  (path: string): MethodDecorator => {
    return (target, property, descriptor) => {
      Reflect.defineMetadata(META_PATH_KEY, path, descriptor.value);
      Reflect.defineMetadata(META_METHOD_KEY, method, descriptor.value);
    };
  };

export const Get = createMappingDecorator(Methods.GET);
export const Post = createMappingDecorator(Methods.POST);
export const Delete = createMappingDecorator(Methods.DELETE);
export const Put = createMappingDecorator(Methods.PUT);
export const Head = createMappingDecorator(Methods.HEAD);

export function mapRoute(Cls: Constructor) {
  const instance = new Cls();
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
      const method = Reflect.getMetadata(META_METHOD_KEY, fn);
      return {
        route,
        method,
        fn,
        item,
        instance,
        cls: Cls,
        methodName: item,
      };
    }).filter(Boolean);
}

// export function PathParam(paramName: string) {
//   return function (target: any, methodName: string, paramIndex: number) {
//     !target.$Meta && (target.$Meta = {});
//     target.$Meta[paramIndex] = paramName;
//   };
// }
