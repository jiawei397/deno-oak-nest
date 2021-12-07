// deno-lint-ignore-file no-explicit-any
import { Context, Reflect, UnauthorizedException } from "../deps.ts";
import {
  CanActivate,
  Constructor,
  ControllerMethod,
  InjectedData,
} from "./interface.ts";
import { transferParam } from "./params.ts";

export const META_METHOD_KEY = Symbol("meta:method");
export const META_PATH_KEY = Symbol("meta:path");
export const META_GUARD_KEY = Symbol("meta:guard");
export const META_FUNCTION_KEY = Symbol("meta:fn");

const classCaches = new Map<Constructor, any>();

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

export function SetMetadata<K = string, V = any>(
  metadataKey: K,
  metadataValue: V,
) {
  const decoratorFactory = (
    target: any,
    _propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) => {
    if (descriptor) {
      Reflect.defineMetadata(metadataKey, metadataValue, descriptor.value);
      return descriptor;
    }
    Reflect.defineMetadata(metadataKey, metadataValue, target);
    return target;
  };
  decoratorFactory.KEY = metadataKey;
  return decoratorFactory;
}

export function getMetadataForGuard(metadataKey: string, context: Context) {
  const fn = Reflect.getMetadata(META_FUNCTION_KEY, context);
  if (fn) {
    return Reflect.getMetadata(metadataKey, fn);
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
          _guard = classCaches.get(guard);
          if (!_guard) {
            _guard = new (guard as any)();
            classCaches.set(guard, _guard);
          }
        }
        Reflect.defineMetadata(META_FUNCTION_KEY, fn, context); // record the function to context
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

export const Injectable = (): ClassDecorator => (_target) => {};

export const factory = new Map();

export const Factory = async <T>(target: Constructor<T>): Promise<T> => {
  const providers = Reflect.getMetadata("design:paramtypes", target);
  let args: any[] = [];
  if (providers?.length) {
    args = await Promise.all(
      providers.map((provider: Constructor, index: number) => {
        const injectedData = Reflect.getMetadata(
          "design:inject" + index,
          target,
        ) as InjectedData;
        if (typeof injectedData?.fn === "function") {
          return injectedData.fn.apply(null, injectedData.params);
        }
        return Factory(provider);
      }),
    );
  }
  if (factory.has(target)) {
    // console.log("factory.has cache", target);
    return factory.get(target);
  }
  const instance = new target(...args);
  factory.set(target, instance);
  return instance;
};

export async function mapRoute(Cls: Constructor) {
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
