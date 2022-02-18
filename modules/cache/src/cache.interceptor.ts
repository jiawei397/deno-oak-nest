// deno-lint-ignore-file no-explicit-any
import {
  Context,
  Inject,
  Injectable,
  NestInterceptor,
  NestInterceptorOptions,
  Next,
  Reflect,
} from "../../../mod.ts";
import { isDebug } from "../../../src/utils.ts";
import {
  META_CACHE_KEY_KEY,
  META_CACHE_POLICY_KEY,
  META_CACHE_TTL_KEY,
  optionKey,
} from "./cache.constant.ts";
import { CacheModuleOptions, CachePolicy } from "./cache.interface.ts";

export function CacheTTL(seconds: number) {
  return (_target: any, _methodName: string, descriptor: any) => {
    Reflect.defineMetadata(META_CACHE_TTL_KEY, seconds, descriptor.value);
  };
}

export function CacheKey(key: string) {
  return (_target: any, _methodName: string, descriptor: any) => {
    Reflect.defineMetadata(META_CACHE_KEY_KEY, key, descriptor.value);
  };
}

export function SetCachePolicy(policy: CachePolicy) {
  return (_target: any, _methodName: string, descriptor: any) => {
    Reflect.defineMetadata(META_CACHE_POLICY_KEY, policy, descriptor.value);
  };
}

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  ttl: number;
  max: number;
  policy: CachePolicy;
  constructor(
    @Inject(optionKey) private cacheModuleOptions?: CacheModuleOptions,
  ) {
    this.ttl = cacheModuleOptions?.ttl || 5;
    this.max = cacheModuleOptions?.max || 100;
    this.policy = cacheModuleOptions?.policy || "no-cache";
  }

  private caches = new Map<string, any>();

  joinArgs(args: any[]) {
    let result = "";
    args.forEach((arg) => {
      if (typeof arg === "object") {
        result += JSON.stringify(arg);
      } else {
        if (arg) {
          result += arg;
        }
      }
    });
    return result;
  }
  async intercept(
    context: Context,
    next: Next,
    options: NestInterceptorOptions,
  ) {
    if (context.request.method !== "GET") { // only deal get request
      return next();
    }
    const cache = this.caches;
    if (cache.size >= this.max) {
      console.warn("cache size has reached the max", cache.size);
      return next();
    }
    const constructorName = options.target.constructor.name;

    const key = Reflect.getOwnMetadata(
      META_CACHE_KEY_KEY,
      options.target[options.methodName],
    ) ||
      (this.cacheModuleOptions?.getCacheKey
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
          this.joinArgs(options.args),
        ].join("_"));
    const cacheValue = cache.get(key);
    const policy = Reflect.getOwnMetadata(
      META_CACHE_POLICY_KEY,
      options.target[options.methodName],
    ) || this.policy;

    if (cacheValue !== undefined) {
      if (isDebug()) {
        console.debug("cache hit", key, cacheValue);
      }
      return cacheValue;
    }
    const result = next();
    cache.set(key, result);

    const ttl = Reflect.getOwnMetadata(
      META_CACHE_TTL_KEY,
      options.target[options.methodName],
    ) || this.ttl;
    const st = setTimeout(() => {
      cache.delete(key);
    }, ttl * 1000);
    const clear = () => {
      cache.delete(key);
      clearTimeout(st);
    };
    try {
      let val = await result;
      if (context.response.body !== undefined) {
        val = context.response.body;
        cache.set(key, val);
      }
      if (this.cacheModuleOptions?.isCacheableValue) {
        if (!this.cacheModuleOptions.isCacheableValue(val)) {
          clear();
          return val;
        }
      }
      if (policy === "public" || policy === "private") {
        context.response.headers.set(
          "Cache-Control",
          policy === "public" ? `max-age=${ttl}` : `${policy}, max-age=${ttl}`,
        );
      }
      return val;
    } catch (error) {
      clear();
      throw error;
    }
  }
}
