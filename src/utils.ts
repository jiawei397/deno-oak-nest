// deno-lint-ignore-file no-explicit-any
import { Context, Reflect } from "../deps.ts";
import { UnauthorizedException } from "./exception.ts";
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

function transResponseResult(context: Context, result: any) {
  if (context.response.body === undefined) {
    context.response.body = result;
  }
}

export function overrideFnByGuard(
  guards: CanActivate[],
  target: unknown,
  fn: ControllerMethod,
  methodName: string,
) {
  return async function (...args: any[]) {
    const context: Context = args[0];
    // I removed the origin error catch, because it should be deal by middleware.
    if (guards) {
      for (const guard of guards) {
        let _guard = guard;
        if (typeof guard === "function") {
          _guard = new (guard as any)();
        }
        const result = await _guard.canActivate(context);
        if (!result) {
          throw new UnauthorizedException(UnauthorizedException.name);
        }
      }
    }
    await transferParam(target, methodName, args);
    const result = await fn.apply(target, args);
    transResponseResult(context, result);
    return result;
  };
}

// deno-lint-ignore ban-types
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
    return (_target, _property, descriptor) => {
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
