// deno-lint-ignore-file no-explicit-any
import { Context, Reflect, UnauthorizedException } from "../deps.ts";
import { CanActivate, Constructor, ControllerMethod } from "./interface.ts";
import { transferParam } from "./params.ts";

const classCaches = new Map<Constructor, any>();

export const META_FUNCTION_KEY = Symbol("meta:fn");
export const META_GUARD_KEY = Symbol("meta:guard");

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
  target: any,
  fn: ControllerMethod,
  methodName: string,
) {
  return async function (...args: any[]) {
    const context: Context = args[0];
    const classGuards = Reflect.getMetadata(META_GUARD_KEY, target) || [];
    const fnGuards = Reflect.getMetadata(META_GUARD_KEY, fn) || [];
    const guards = [...classGuards, ...fnGuards];
    // I removed the origin error catch, because it should be deal by middleware.
    if (guards.length > 0) {
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

function transResponseResult(context: Context, result: any) {
  if (context.response.body === undefined) {
    context.response.body = result;
  }
}
