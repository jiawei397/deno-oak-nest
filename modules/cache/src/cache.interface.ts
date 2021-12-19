// deno-lint-ignore-file no-explicit-any
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
  //   store?: string | CacheStoreFactory;
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
  isCacheableValue?: (value: any) => boolean;

  getCacheKey?: (params: {
    constructorName: string;
    methodName: string;
    methodType: string;
    args: any[];
  }) => string;
}

export interface CacheModuleOptions extends CacheManagerOptions {
  [key: string]: any;
}
