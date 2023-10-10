// deno-lint-ignore-file no-explicit-any
import {
  Context,
  Inject,
  Injectable,
  isDebug,
  NestInterceptor,
  NestInterceptorOptions,
  Next,
  Reflect,
} from "../../../mod.ts";
import {
  META_CACHE_KEY_KEY,
  META_CACHE_POLICY_KEY,
  META_CACHE_STORE_KEY,
  META_CACHE_TTL_KEY,
  optionKey,
} from "./cache.constant.ts";
import type {
  CacheModuleOptions,
  CachePolicy,
  CacheStoreMap,
  ICacheStore,
} from "./cache.interface.ts";
import { LocalStore } from "./cache.store.ts";
import LRU from "./lru/mod.ts";

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
  policy: CachePolicy;
  customCache?: ICacheStore;
  lruCache: LRU<string, unknown>;
  localCache?: LocalStore;
  defaultStore?: string;
  isDebug?: boolean;
  constructor(
    @Inject(optionKey) private cacheModuleOptions?: CacheModuleOptions,
  ) {
    this.ttl = cacheModuleOptions?.ttl || 5;
    this.policy = cacheModuleOptions?.policy || "no-cache";
    this.isDebug = cacheModuleOptions?.isDebug ?? isDebug();
    this.lruCache = new LRU({
      max: cacheModuleOptions?.max || 500,
      maxSize: cacheModuleOptions?.maxSize || 1_000_000,
      ttl: this.ttl * 1000,
      sizeCalculation: (value) => {
        if (typeof value !== "string") {
          return 1;
        }
        return value.length;
      },
      dispose: (_value, key) => {
        if (this.isDebug) {
          console.debug(`cache ${key} will be disposed`);
        }
      },
    });
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
        this.defaultStore = "LRU";
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
    let caches: ICacheStore | undefined;
    if (storeName === "localStorage") {
      if (!this.localCache) {
        this.localCache = new LocalStore();
      }
      caches = this.localCache;
      // deno-lint-ignore no-empty
    } else if (storeName === "LRU") {
    } else {
      caches = this.customCache!;
    }
    const cacheValue = this.lruCache.get(key) ?? await caches?.get(key);
    if (cacheValue !== undefined) {
      if (this.isDebug) {
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
        lastResult = result.then((val) => context.response?.body ?? val);
      }
      this.lruCache.set(key, lastResult, { ttl: ttl * 1000 }); // LRU is in milliseconds
    } else {
      await caches?.set(key, lastResult, { ttl });
      isCached = true;
    }
    try {
      const val = await lastResult;
      if (this.cacheModuleOptions?.isCacheableValue) {
        if (!this.cacheModuleOptions.isCacheableValue(val)) {
          this.lruCache.delete(key);
          await caches?.delete(key);
          return val;
        }
      }
      if (!isCached && caches) {
        await caches.set(key, val, { ttl });
        this.lruCache.delete(key);
      }
      if (policy === "public" || policy === "private") {
        context.response.headers.set(
          "Cache-Control",
          policy === "public" ? `max-age=${ttl}` : `${policy}, max-age=${ttl}`,
        );
      }
      return val;
    } catch (error) {
      this.lruCache.delete(key);
      await caches?.delete(key);
      throw error;
    }
  }
}
