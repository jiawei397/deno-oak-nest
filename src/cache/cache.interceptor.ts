// deno-lint-ignore-file no-explicit-any
// CacheInterceptor

import {
  Context,
  Inject,
  Injectable,
  NestInterceptor,
  NestInterceptorOptions,
  Next,
} from "../../mod.ts";
import { isDebug } from "../../src/utils.ts";
import { optionKey } from "./cache.constant.ts";
import { CacheModuleOptions } from "./cache.interface.ts";

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  ttl: number;
  max: number;
  constructor(
    @Inject(optionKey) private cacheModuleOptions: CacheModuleOptions,
  ) {
    this.ttl = cacheModuleOptions.ttl || 5;
    this.max = cacheModuleOptions.max || 100;
    console.log(this.ttl, "---ttl");
  }

  private caches = new Map<string, any>();
  intercept(
    _context: Context,
    next: Next,
    options: NestInterceptorOptions,
  ) {
    const cache = this.caches;
    if (cache.size >= this.max) {
      console.warn("cache size has reached the max", cache.size);
      return;
    }
    const constructorName = options.target.constructor.name;

    const key = this.cacheModuleOptions.getCacheKey
      ? this.cacheModuleOptions.getCacheKey({
        constructorName,
        methodName: options.methodName,
        methodType: options.methodType,
        args: options.args,
      })
      : [
        constructorName,
        options.methodName,
        options.methodType,
        options.args.join("-"),
      ].join("_");
    const cacheValue = cache.get(key);
    if (cacheValue !== undefined) {
      if (isDebug()) {
        console.debug("cache hit", key, cacheValue);
      }
      return cacheValue;
    }
    const result = next();
    cache.set(key, result);
    const st = setTimeout(() => {
      cache.delete(key);
    }, this.ttl * 1000);
    Promise.resolve(result)
      .then((val) => {
        if (this.cacheModuleOptions.isCacheableValue) {
          if (!this.cacheModuleOptions.isCacheableValue(val)) {
            cache.delete(key);
            clearTimeout(st);
          }
        }
      })
      .catch(() => {
        cache.delete(key);
        clearTimeout(st);
      });
    return result;
  }
}
