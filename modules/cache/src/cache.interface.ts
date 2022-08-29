// deno-lint-ignore-file no-explicit-any

/**
 * If you want the results to be cached directly by the browser, you can set it to public or private.
 *
 * If you want get the results from the cache, but not to trans it by net, you can set it to no-cache, and the status may be 304 if no modified.
 * @see https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Headers/Cache-Control
 */
export type CachePolicy = "public" | "private" | "no-cache";

export interface CacheStore {
  get<T = any>(key: string): Promise<T | undefined> | T | undefined;
  set(
    key: string,
    value: any,
    options?: { ttl: number },
  ): Promise<any> | any;

  delete(key: string): Promise<any> | any;

  clear(): Promise<any> | any;

  has(key: string): Promise<boolean> | boolean;

  size(): Promise<number> | number;
}

export interface CacheStoreMap {
  name: string;
  store: CacheStore;
}

export type CacheFactory = () =>
  | CacheStoreMap
  | Promise<CacheStoreMap>;

/**
 * Interface defining Cache Manager configuration options.
 *
 * @publicApi
 */
export interface CacheManagerOptions {
  /**
   * Cache storage manager.  Default is `'memory'` (in-memory store).  See
   * [Different stores](https://docs.nestjs.com/techniques/caching#different-stores)
   * for more info.
   */
  store?: "memory" | "localStorage" | CacheStoreMap | CacheFactory;
  defaultStore?: "memory" | "localStorage" | string;
  /**
   * Time to live - amount of time in seconds that a response is cached before it
   * is deleted. Subsequent request will call through the route handler and refresh
   * the cache.  Defaults to 5 seconds.
   */
  ttl?: number;
  /**
   * Maximum number of responses to store in the cache.  Defaults to 100.
   */
  max?: number;
  maxSize?: number;
  isCacheableValue?: (value: any) => boolean;

  getCacheKey?: (params: {
    constructorName: string;
    methodName: string;
    methodType: string;
    args: any[];
  }) => string;

  /**
   * This options will be used to configure the cache-control header.
   * @default "no-cache"
   */
  policy?: CachePolicy;

  isDebug?: boolean;
}

export interface CacheModuleOptions extends CacheManagerOptions {
  [key: string]: any;
}

export interface LocalValue {
  td: number | undefined;
  value: any;
}
