// deno-lint-ignore-file no-explicit-any
import { Reflect } from "../../deps.ts";
import { isDebug } from "../utils.ts";

export type GetCacheKey = (...args: any[]) => string;

function transArgs(...args: any[]) {
  return args.map((arg) => {
    if (typeof arg === "object") {
      return JSON.stringify(arg);
    }
    return arg;
  }).join("_");
}

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
      const key = getCacheKey
        ? getCacheKey.apply(this, args)
        : transArgs(...args);
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
      if (timeout >= 0) {
        setTimeout(() => {
          cache[key] = undefined;
        }, timeout);
      }
      Promise.resolve(result).catch(() => {
        cache[key] = undefined;
      });
      return result;
    };
    return descriptor;
  };
}
