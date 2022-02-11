// deno-lint-ignore-file no-explicit-any
import {
  calculate,
  Context,
  ifNoneMatch,
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

export function CacheTTL(ttl: number) {
  return (_target: any, _methodName: string, descriptor: any) => {
    Reflect.defineMetadata(META_CACHE_TTL_KEY, ttl, descriptor.value);
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

  async checkEtag(context: Context, val: unknown) {
    const etag = context.request.headers.get("If-None-Match");
    const str = JSON.stringify(val);
    const etagOptions = { weak: true };
    const actual = await calculate(str, etagOptions);
    context.response.headers.set("etag", actual);
    context.response.headers.set("Cache-Control", "no-cache");
    if (
      etag && !await ifNoneMatch(etag, str, etagOptions) // if etag is not match, then will return 200
    ) {
      context.response.status = 304;
    }
    return val;
  }

  async intercept(
    context: Context,
    next: Next,
    options: NestInterceptorOptions,
  ) {
    const cache = this.caches;
    if (cache.size >= this.max) {
      console.warn("cache size has reached the max", cache.size);
      return;
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
      if (policy === "no-cache") { // may return 304 when not modified
        return this.checkEtag(context, await cacheValue);
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
    try {
      const val = await result;
      if (this.cacheModuleOptions?.isCacheableValue) {
        if (!this.cacheModuleOptions.isCacheableValue(val)) {
          cache.delete(key);
          clearTimeout(st);
          return val;
        }
      }
      if (policy === "no-cache") {
        return this.checkEtag(context, val);
      } else {
        context.response.headers.set(
          "Cache-Control",
          policy === "public" ? `max-age=${ttl}` : `${policy}, max-age=${ttl}`,
        );
        return val;
      }
    } catch (error) {
      cache.delete(key);
      clearTimeout(st);
      throw error;
    }
  }
}
