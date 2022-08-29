// deno-lint-ignore-file no-explicit-any
type DisposeReason = "evict" | "set" | "delete";

export type SizeCalculator<K, V> = (value: V, key: K) => number;
export type Disposer<K, V> = (
  value: V,
  key: K,
  reason: DisposeReason,
) => void;
export type Fetcher<K, V> = (
  key: K,
  staleValue: V,
  options: FetcherOptions<K, V>,
) => Promise<V | void | undefined> | V | void | undefined;

/**
 * options which override the options set in the LRUCache constructor
 * when making `cache.set()` calls.
 */
export interface SetOptions<K, V> {
  /**
   * A value for the size of the entry, prevents calls to
   * `sizeCalculation` function.
   */
  size?: number;
  sizeCalculation?: SizeCalculator<K, V>;
  ttl?: number;
  start?: number;
  noDisposeOnSet?: boolean;
  noUpdateTTL?: boolean;
}

/**
 * options which override the options set in the LRUCache constructor
 * when making `cache.get()` calls.
 */
export interface GetOptions {
  allowStale?: boolean;
  updateAgeOnGet?: boolean;
  noDeleteOnStaleGet?: boolean;
}

interface FetcherFetchOptions<K, V> {
  allowStale?: boolean;
  updateAgeOnGet?: boolean;
  noDeleteOnStaleGet?: boolean;
  size?: number;
  sizeCalculation?: SizeCalculator<K, V>;
  ttl?: number;
  noDisposeOnSet?: boolean;
  noUpdateTTL?: boolean;
  noDeleteOnFetchRejection?: boolean;
}

/**
 * options which override the options set in the LRUCache constructor
 * when making `cache.fetch()` calls.
 * This is the union of GetOptions and SetOptions, plus
 * `noDeleteOnFetchRejection`, `forceRefresh`, and `fetchContext`
 */
export interface FetchOptions<K, V> extends FetcherFetchOptions<K, V> {
  forceRefresh?: boolean;
  fetchContext?: any;
}

interface FetcherOptions<K, V> {
  signal: AbortSignal;
  options: FetcherFetchOptions<K, V>;
  context: any;
}

export interface Entry<V> {
  value: V;
  ttl?: number;
  size?: number;
  start?: number;
}

export type Options<K, V> = {
  max: number;
  /**
   * Max time in milliseconds for items to live in cache before they are
   * considered stale.  Note that stale items are NOT preemptively removed
   * by default, and MAY live in the cache, contributing to its LRU max,
   * long after they have expired.
   *
   * Also, as this cache is optimized for LRU/MRU operations, some of
   * the staleness/TTL checks will reduce performance, as they will incur
   * overhead by deleting items.
   *
   * Must be an integer number of ms, defaults to 0, which means "no TTL"
   */
  ttl: number;
  /**
   * Minimum amount of time in ms in which to check for staleness.
   * Defaults to 1, which means that the current time is checked
   * at most once per millisecond.
   *
   * Set to 0 to check the current time every time staleness is tested.
   * (This reduces performance, and is theoretically unnecessary.)
   *
   * Setting this to a higher value will improve performance somewhat
   * while using ttl tracking, albeit at the expense of keeping stale
   * items around a bit longer than intended.
   *
   * @default 1
   * @since 7.1.0
   */
  ttlResolution?: number;
  /**
   * Preemptively remove stale items from the cache.
   * Note that this may significantly degrade performance,
   * especially if the cache is storing a large number of items.
   * It is almost always best to just leave the stale items in
   * the cache, and let them fall out as new items are added.
   *
   * Note that this means that allowStale is a bit pointless,
   * as stale items will be deleted almost as soon as they expire.
   *
   * Use with caution!
   *
   * @default false
   * @since 7.1.0
   */
  ttlAutopurge?: boolean;

  /**
   * Return stale items from cache.get() before disposing of them.
   * Return stale values from cache.fetch() while performing a call
   * to the `fetchMethod` in the background.
   *
   * @default false
   */
  allowStale?: boolean;

  /**
   * Update the age of items on cache.get(), renewing their TTL
   *
   * @default false
   */
  updateAgeOnGet?: boolean;

  /**
   * Do not delete stale items when they are retrieved with cache.get()
   * Note that the get() return value will still be `undefined` unless
   * allowStale is true.
   *
   * @default false
   * @since 7.11.0
   */
  noDeleteOnStaleGet?: boolean;

  /**
   * Update the age of items on cache.has(), renewing their TTL
   *
   * @default false
   */
  updateAgeOnHas?: boolean;

  /**
   * Function that is called on items when they are dropped from the cache.
   * This can be handy if you want to close file descriptors or do other
   * cleanup tasks when items are no longer accessible. Called with `key,
   * value`.  It's called before actually removing the item from the
   * internal cache, so it is *NOT* safe to re-add them.
   * Use `disposeAfter` if you wish to dispose items after they have been
   * full removed, when it is safe to add them back to the cache.
   */
  dispose?: Disposer<K, V>;

  /**
   * The same as dispose, but called *after* the entry is completely
   * removed and the cache is once again in a clean state.  It is safe to
   * add an item right back into the cache at this point.
   * However, note that it is *very* easy to inadvertently create infinite
   * recursion this way.
   *
   * @since 7.3.0
   */
  disposeAfter?: Disposer<K, V>;

  /**
   * Set to true to suppress calling the dispose() function if the entry
   * key is still accessible within the cache.
   * This may be overridden by passing an options object to cache.set().
   *
   * @default false
   */
  noDisposeOnSet?: boolean;

  /**
   * `fetchMethod` Function that is used to make background asynchronous
   * fetches.  Called with `fetchMethod(key, staleValue)`.  May return a
   * Promise.
   *
   * If `fetchMethod` is not provided, then `cache.fetch(key)` is
   * equivalent to `Promise.resolve(cache.get(key))`.
   *
   * @since 7.6.0
   */
  fetchMethod?: Fetcher<K, V>;

  /**
   * Set to true to suppress the deletion of stale data when a
   * `fetchMethod` throws an error or returns a rejected promise
   *
   * @default false
   * @since 7.10.0
   */
  noDeleteOnFetchRejection?: boolean;

  /**
   * Set to any value in the constructor or fetch() options to
   * pass arbitrary data to the fetch() method in the options.context
   * field.
   *
   * @since 7.12.0
   */
  fetchContext?: any;
  /**
   * Boolean flag to tell the cache to not update the TTL when
   * setting a new value for an existing key (ie, when updating a value
   * rather than inserting a new value).  Note that the TTL value is
   * _always_ set (if provided) when adding a new entry into the cache.
   *
   * @default false
   * @since 7.4.0
   */
  noUpdateTTL?: boolean;
  /**
   * If you wish to track item size, you must provide a maxSize
   * note that we still will only keep up to max *actual items*,
   * if max is set, so size tracking may cause fewer than max items
   * to be stored.  At the extreme, a single item of maxSize size
   * will cause everything else in the cache to be dropped when it
   * is added.  Use with caution!
   * Note also that size tracking can negatively impact performance,
   * though for most cases, only minimally.
   */
  maxSize: number;

  /**
   * Function to calculate size of items.  Useful if storing strings or
   * buffers or other items where memory size depends on the object itself.
   * Also note that oversized items do NOT immediately get dropped from
   * the cache, though they will cause faster turnover in the storage.
   */
  sizeCalculation?: SizeCalculator<K, V>;
};
