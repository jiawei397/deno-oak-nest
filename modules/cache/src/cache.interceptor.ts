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
  CacheStoreName,
  ICacheStore,
} from "./cache.interface.ts";
import { KVStore, LocalStore, MemoryStore } from "./cache.store.ts";
import { md5 } from "./cache.utils.ts";
import { LRUCache } from "../deps.ts";

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
export function SetCacheStore(key: CacheStoreName | string) {
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
  // customCache?: ICacheStore;
  // lruCache: LRUCache<string, any>;
  // localCache?: LocalStore;
  // defaultStore?: string;
  memoryCache: MemoryStore;
  isDebug?: boolean;
  cacheMap: Map<string, ICacheStore>;
  constructor(
    @Inject(optionKey) private cacheModuleOptions?: CacheModuleOptions,
  ) {
    this.ttl = cacheModuleOptions?.ttl || 5;
    this.policy = cacheModuleOptions?.policy || "no-cache";
    this.isDebug = cacheModuleOptions?.isDebug ?? isDebug();
    this.cacheMap = new Map();
    const store = new MemoryStore({ ttl: this.ttl });
    this.memoryCache = store;
    this.cacheMap.set("memory", store);
    // this.initStore();
  }

  joinArgs(args: any[]) {
    const arr = args.map((arg) => {
      if (typeof arg === "object") {
        return JSON.stringify(arg);
      } else {
        return arg;
      }
    });
    return arr.join("_");
  }

  async getCaches(
    func: any,
  ): Promise<{ storeName: string; caches: ICacheStore | undefined }> {
    let storeName = Reflect.getOwnMetadata(META_CACHE_STORE_KEY, func);
    if (
      !storeName && this.cacheModuleOptions?.store &&
      typeof this.cacheModuleOptions.store === "string"
    ) {
      storeName = this.cacheModuleOptions.store;
    }
    let caches = storeName ? this.cacheMap.get(storeName) : undefined;
    if (caches) {
      return {
        storeName,
        caches,
      };
    }
    await this.initStore(storeName);
    caches = storeName ? this.cacheMap.get(storeName) : undefined;
    return {
      storeName,
      caches,
    };
  }

  async initStore(
    storeName?: CacheStoreName,
  ): Promise<void> {
    const ttl = this.cacheModuleOptions?.ttl;
    if (storeName === "localStorage") {
      const store = new LocalStore({ ttl });
      this.cacheMap.set(storeName, store);
      this.log("localStorage inited");
      return;
    }
    // if (storeName === "memory") {
    //   const store = new MemoryStore({ ttl });
    //   this.cacheMap.set(storeName, store);
    //   this.log("memory inited");
    //   return;
    // }
    if (storeName === "LRU") {
      const store: ICacheStore = new LRUCache({
        max: this.cacheModuleOptions?.max || 1000,
        maxSize: this.cacheModuleOptions?.maxSize || 1_000_000,
        ttl: this.ttl * 1000,
        sizeCalculation: (value) => {
          if (typeof value !== "string") {
            return 1;
          }
          return value.length;
        },
        dispose: (_value, key) => {
          this.log(`cache ${key} will be disposed`);
        },
      });
      this.cacheMap.set(storeName, store);
      this.log("LRU inited");
      return;
    }
    if (storeName === "KVStore") {
      const store = new KVStore({
        baseKey: this.cacheModuleOptions?.kvStoreBaseKey,
        ttl,
      });
      await store.init();
      this.cacheMap.set(storeName, store);
      this.log("KVStore inited");
      return;
    }
    const store = this.cacheModuleOptions?.store;
    if (!store) {
      return;
    }
    if (typeof store !== "string") {
      let cacheMap: CacheStoreMap;
      if (typeof store === "function") {
        cacheMap = await store();
      } else {
        cacheMap = store;
      }
      this.cacheMap.set(cacheMap.name, cacheMap.store);
      this.log(`${cacheMap.name} inited`);
      return;
    }
  }

  log(...args: any[]) {
    if (this.isDebug) {
      console.debug(...args);
    }
  }

  private getCacheKey(params: {
    constructorName: string;
    methodName: string;
    methodType: string;
    args: any[];
  }): string {
    const str = [
      params.constructorName,
      params.methodName,
      params.methodType,
      this.joinArgs(params.args),
    ].join("_");
    return md5(str);
  }

  setCacheHeaderByPolicy(func: any, context: Context, ttl?: number) {
    const policy = Reflect.getOwnMetadata(META_CACHE_POLICY_KEY, func) ||
      this.policy;
    if (policy === "public" || policy === "private") {
      const maxAge = ttl ?? this.getTTL(func);
      context.response.headers.set(
        "Cache-Control",
        `${policy}, max-age=${maxAge}`,
      );
    } else if (policy === "no-cache") {
      context.response.headers.set(
        "Cache-Control",
        `no-cache`,
      );
    }
  }

  private getTTL(func: any): number {
    return Reflect.getOwnMetadata(META_CACHE_TTL_KEY, func) || this.ttl;
  }

  getCacheKeyByOptions(options: NestInterceptorOptions): string {
    const constructorName = options.target.constructor.name;
    const func = options.target[options.methodName];
    return Reflect.getOwnMetadata(META_CACHE_KEY_KEY, func) ||
      (this.cacheModuleOptions?.getCacheKey || this.getCacheKey).call(this, {
        constructorName,
        methodName: options.methodName,
        methodType: options.methodType,
        args: options.args,
      });
  }

  async intercept(
    context: Context,
    next: Next,
    options: NestInterceptorOptions,
  ) {
    if (context.request.method !== "GET") { // only deal get request
      return next();
    }
    const response = context.response;
    const key = this.getCacheKeyByOptions(options);

    const func = options.target[options.methodName];
    let cacheValue = this.memoryCache.get(key);
    if (cacheValue !== undefined) {
      this.log(`memory cache hit key [${key}],`, cacheValue);
      this.setCacheHeaderByPolicy(func, context);
      response.body = cacheValue;
      return;
    }
    const { caches, storeName } = await this.getCaches(func);
    if (caches) {
      cacheValue = await caches.get(key);
      if (cacheValue !== undefined) {
        this.log(`${storeName} cache hit key [${key}],`, cacheValue);
        this.setCacheHeaderByPolicy(func, context);
        response.body = cacheValue;
        return;
      }
    }
    const result = next();
    const ttl = this.getTTL(func);
    let isCached = false;
    let lastResult: any = context.response.body ?? result;
    if (lastResult && (lastResult instanceof Promise || !caches)) {
      if (lastResult instanceof Promise) {
        lastResult = lastResult.then(() => context.response.body);
      }
      this.memoryCache.set(key, lastResult, { ttl });
    } else if (caches) {
      await caches.set(key, lastResult, { ttl });
      isCached = true;
    }
    try {
      const val = await lastResult;
      if (this.cacheModuleOptions?.isCacheableValue) {
        if (!this.cacheModuleOptions.isCacheableValue(val)) {
          this.memoryCache.delete(key);
          await caches?.delete(key);
          response.body = val;
          return;
        }
      }
      if (!isCached && caches && storeName !== "memory") {
        await caches.set(key, val, { ttl });
        this.memoryCache.delete(key);
      }
      this.setCacheHeaderByPolicy(func, context, ttl);
      response.body = val;
    } catch (error) {
      this.memoryCache.delete(key);
      await caches?.delete(key);
      throw error;
    }
  }
}
