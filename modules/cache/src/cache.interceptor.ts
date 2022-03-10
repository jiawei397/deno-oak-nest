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
  META_CACHE_STORE_KEY,
  META_CACHE_TTL_KEY,
  optionKey,
} from "./cache.constant.ts";
import {
  CacheModuleOptions,
  CachePolicy,
  CacheStore,
  CacheStoreMap,
} from "./cache.interface.ts";
import { LocalStore, MemoryStore } from "./cache.store.ts";

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
export function SetCacheStore(key: "localStorage" | "memory" | string) {
  return (_target: any, _methodName: string, descriptor: any) => {
    Reflect.defineMetadata(META_CACHE_STORE_KEY, key, descriptor.value);
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
  customCache?: CacheStore;
  memoryCache: MemoryStore;
  localCache?: LocalStore;
  defaultStore?: string;
  constructor(
    @Inject(optionKey) private cacheModuleOptions?: CacheModuleOptions,
  ) {
    this.ttl = cacheModuleOptions?.ttl || 5;
    this.max = cacheModuleOptions?.max || 100;
    this.policy = cacheModuleOptions?.policy || "no-cache";
    this.memoryCache = new MemoryStore();
    this.defaultStore = cacheModuleOptions?.defaultStore;
    this.init(cacheModuleOptions);
  }

  async init(cacheModuleOptions?: CacheModuleOptions) {
    if (
      cacheModuleOptions?.store && typeof cacheModuleOptions?.store !== "string"
    ) {
      let store: CacheStoreMap;
      if (typeof cacheModuleOptions.store === "function") {
        store = await cacheModuleOptions.store();
      } else {
        store = cacheModuleOptions.store;
      }
      this.customCache = store.store;
      if (!this.defaultStore) {
        this.defaultStore = store.name;
      }
    } else if (cacheModuleOptions?.store === "localStorage") {
      this.localCache = new LocalStore();
      if (!this.defaultStore) {
        this.defaultStore = "localStorage";
      }
    } else {
      if (!this.defaultStore) {
        this.defaultStore = "memory";
      }
    }
  }

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
    const size = await (this.customCache || this.memoryCache).size();
    if (size >= this.max) {
      console.warn("cache size has reached the max", size);
      return next();
    }
    const constructorName = options.target.constructor.name;
    const func = options.target[options.methodName];

    const key = Reflect.getOwnMetadata(META_CACHE_KEY_KEY, func) ||
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

    const policy = Reflect.getOwnMetadata(META_CACHE_POLICY_KEY, func) ||
      this.policy;
    const storeName = Reflect.getOwnMetadata(META_CACHE_STORE_KEY, func) ||
      this.defaultStore;
    let caches: CacheStore | undefined;
    if (storeName === "localStorage") {
      if (!this.localCache) {
        this.localCache = new LocalStore();
      }
      caches = this.localCache;
      // deno-lint-ignore no-empty
    } else if (storeName === "memory") {
    } else {
      caches = this.customCache!;
    }
    const cacheValue = this.memoryCache.get(key) || await caches?.get(key);
    if (cacheValue !== undefined) {
      if (isDebug()) {
        console.debug("cache hit", key, cacheValue);
      }
      return cacheValue;
    }
    const result = next();
    const ttl: number = Reflect.getOwnMetadata(META_CACHE_TTL_KEY, func) ||
      this.ttl;
    let isCached = false;
    let lastResult: any = context.response.body ?? result;
    if (result && (result instanceof Promise || !caches)) {
      if (result instanceof Promise) {
        lastResult = result.then((val) => context.response.body ?? val);
      }
      this.memoryCache.set(key, lastResult, { ttl });
    } else {
      await caches?.set(key, lastResult, { ttl });
      isCached = true;
    }
    try {
      const val = await lastResult;
      if (this.cacheModuleOptions?.isCacheableValue) {
        if (!this.cacheModuleOptions.isCacheableValue(val)) {
          this.memoryCache.delete(key);
          await caches?.delete(key);
          return val;
        }
      }
      if (!isCached && caches) {
        await caches.set(key, val, { ttl });
        this.memoryCache.delete(key);
      }
      if (policy === "public" || policy === "private") {
        context.response.headers.set(
          "Cache-Control",
          policy === "public" ? `max-age=${ttl}` : `${policy}, max-age=${ttl}`,
        );
      }
      return val;
    } catch (error) {
      this.memoryCache.delete(key);
      await caches?.delete(key);
      throw error;
    }
  }
}
