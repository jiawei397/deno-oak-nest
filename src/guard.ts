// deno-lint-ignore-file no-explicit-any
import { Context, Reflect, UnauthorizedException } from "../deps.ts";
import { Factory } from "./factorys/class.factory.ts";
import {
  CanActivate,
  Constructor,
  ControllerMethod,
} from "./interfaces/mod.ts";

export const META_FUNCTION_KEY = Symbol("meta:fn");
export const META_GUARD_KEY = Symbol("meta:guard");

// deno-lint-ignore ban-types
export function UseGuards(...guards: (CanActivate | Function)[]) {
  return function (
    target: any,
    _property?: string,
    descriptor?: TypedPropertyDescriptor<any>,
  ) {
    Reflect.defineMetadata(
      META_GUARD_KEY,
      guards,
      descriptor ? descriptor.value : target.prototype,
    );
  };
}

export async function checkByGuard(
  target: InstanceType<Constructor>,
  fn: ControllerMethod,
  context: Context,
) {
  const classGuards = Reflect.getMetadata(META_GUARD_KEY, target) || [];
  const fnGuards = Reflect.getMetadata(META_GUARD_KEY, fn) || [];
  const guards = [...classGuards, ...fnGuards];
  // I removed the origin error catch, because it should be deal by middleware.
  if (guards.length > 0) {
    for (const guard of guards) {
      let _guard = guard;
      if (typeof guard === "function") {
        _guard = await Factory(guard);
      }
      Reflect.defineMetadata(META_FUNCTION_KEY, fn, context); // record the function to context
      const result = await _guard.canActivate(context);
      if (!result) {
        return false; // will not continue to next guard and not throw an exception
      }
    }
  }
  return true;
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

export function getMetadataForGuard<T>(
  metadataKey: string,
  context: Context,
): T | undefined {
  const fn = Reflect.getMetadata(META_FUNCTION_KEY, context);
  if (fn) {
    return Reflect.getMetadata(metadataKey, fn);
  }
}

export class Reflector {
  /**
   * Retrieve metadata for a specified key for a specified target.
   *
   * @example
   * `const roles = this.reflector.get<string[]>('roles', context);`
   *
   * @param metadataKey lookup key for metadata to retrieve
   * @param context context (decorated object) to retrieve metadata from
   */
  get<T>(metadataKey: string, context: Context) {
    return getMetadataForGuard<T>(metadataKey, context);
  }
  /**
   * Retrieve metadata for a specified key for a specified set of targets.
   *
   * @param metadataKey lookup key for metadata to retrieve
   * @param targets context (decorated objects) to retrieve metadata from
   */
  getAll(metadataKey: string, targets: any[]) {
    return (targets || []).map((target) =>
      Reflect.getMetadata(metadataKey, target)
    );
  }
}
