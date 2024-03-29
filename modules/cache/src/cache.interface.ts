// deno-lint-ignore-file no-explicit-any

/**
 * If you want the results to be cached directly by the browser, you can set it to public or private.
 *
 * If you want get the results from the cache, but not to trans it by net, you can set it to no-cache, and the status may be 304 if no modified.
 * @see https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Headers/Cache-Control
 */
export type CachePolicy = "public" | "private" | "no-cache";

export interface ICacheStore {
  get<T = any>(key: string): Promise<T | undefined> | T | undefined;
  set(
    key: string,
    value: any,
    options?: {
      /** ttl should be seconds */
      ttl: number;
    },
  ): Promise<any> | any;

  delete(key: string): Promise<any> | any;

  clear(): Promise<any> | any;

  has(key: string): Promise<boolean> | boolean;

  size: number | (() => Promise<number> | number);
}

export interface CacheStoreMap {
  name: string;
  store: ICacheStore;
}

export type CacheFactory = () =>
  | CacheStoreMap
  | Promise<CacheStoreMap>;

export type CacheStoreName = "memory" | "LRU" | "localStorage" | "KVStore";

export interface CacheModuleOptions {
  /**
   * Cache storage manager.  Default is `memory`.
   */
  store?:
    | CacheStoreName
    | CacheStoreMap
    | CacheFactory;
  /**
   * Time to live - amount of time in seconds that a response is cached before it
   * is deleted. Subsequent request will call through the route handler and refresh
   * the cache.  Defaults to 5 seconds.
   */
  ttl?: number;
  /**
   * Maximum number of responses to store in the cache.
   * @default 1000
   * @warning This option is only used when the store is set to `LRU`.
   */
  max?: number;
  /**
   * Maximum size of the cache.
   * @default 1_000_000
   * @warning This option is only used when the store is set to `LRU`.
   */
  maxSize?: number;
  /**
   * A function to determine if a value is cacheable.  Defaults to only cache
   */
  isCacheableValue?: (value: any) => boolean;

  /**
   * A function to determine the cache key.  Defaults to the request url.
   */
  getCacheKey?: (params: {
    constructorName: string;
    methodName: string;
    methodType: string;
    args: any[];
  }) => string;

  /**
   * This options will be used to configure the cache-control header.
   */
  policy?: CachePolicy;

  isDebug?: boolean;

  /**
   * The key of the kv store base key.
   * @warning This option is only used when the store is set to `KVStore`.
   */
  kvStoreBaseKey?: string;
}

export interface LocalValue {
  td: number | undefined;
  value: any;
}
