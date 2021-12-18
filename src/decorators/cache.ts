// deno-lint-ignore-file no-explicit-any
import { Reflect } from "../../deps.ts";
import { isDebug } from "../utils.ts";

export type GetCacheKey = (...args: any[]) => string;

/**
 * Cache decorator
 */
export function Cache(
  timeout: number,
  getCacheKey?: GetCacheKey,
): MethodDecorator {
  return (
    _target: any,
    _methodName: string | symbol,
    descriptor: PropertyDescriptor,
  ) => {
    const originalMethod = descriptor.value;
    descriptor.value = function (...args: any[]) {
      const key = getCacheKey ? getCacheKey.apply(this, args) : args.join("-");
      let cache: Record<string, any> = Reflect.getMetadata("cache", descriptor);
      if (cache) {
        if (cache[key] !== undefined) {
          if (isDebug()) {
            console.debug("cache hit", key, cache[key]);
          }
          return cache[key];
        }
      } else {
        cache = {};
        Reflect.defineMetadata("cache", cache, descriptor);
      }
      const result = originalMethod.apply(this, args);
      cache[key] = result;
      setTimeout(() => {
        cache[key] = undefined;
      }, timeout);
      return result;
    };
    return descriptor;
  };
}
