// deno-lint-ignore-file no-explicit-any no-explicit-any no-unused-vars
// forked from https://github.com/isaacs/node-lru-cache, v7.14.0, just remove some polyfills
import {
  Disposer,
  Entry,
  Fetcher,
  FetchOptions,
  GetOptions,
  Options,
  SetOptions,
  SizeCalculator,
} from "./types.ts";

const perf = performance;

const AC = AbortController;
const AS = AbortSignal;

const warned = new Set();

const emitWarning = (...a: any[]) => {
  console.error(...a);
};

const shouldWarn = (code: any) => !warned.has(code);

const isPosInt = (n: number) =>
  n && n === Math.floor(n) && n > 0 && isFinite(n);

/* istanbul ignore next - This is a little bit ridiculous, tbh.
 * The maximum array length is 2^32-1 or thereabouts on most JS impls.
 * And well before that point, you're caching the entire world, I mean,
 * that's ~32GB of just integers for the next/prev links, plus whatever
 * else to hold that many keys and values.  Just filling the memory with
 * zeroes at init time is brutal when you get that big.
 * But why not be complete?
 * Maybe in the future, these limits will have expanded. */
const getUintArray = (max: number) =>
  !isPosInt(max)
    ? null
    : max <= Math.pow(2, 8)
    ? Uint8Array
    : max <= Math.pow(2, 16)
    ? Uint16Array
    : max <= Math.pow(2, 32)
    ? Uint32Array
    : max <= Number.MAX_SAFE_INTEGER
    ? ZeroArray
    : null;

class ZeroArray extends Array {
  constructor(size: number) {
    super(size);
    this.fill(0);
  }
}

class Stack {
  heap: ZeroArray | Uint32Array | Uint16Array | Uint8Array;
  length = 0;
  constructor(max: number) {
    const UintArray = getUintArray(max);
    this.heap = new UintArray!(max);
  }
  push(n: number) {
    this.heap![this.length++] = n;
  }
  pop() {
    return this.heap[--this.length];
  }
}

export default class LRUCache<K, V> {
  max: number;
  maxSize: number;
  sizeCalculation?: SizeCalculator<K, V>;
  fetchMethod: Fetcher<K, V> | null;
  fetchContext?: any;
  keyMap: Map<any, any>;
  keyList: any[];
  valList: any[];
  next: ZeroArray | Uint32Array | Uint16Array | Uint8Array;
  prev: ZeroArray | Uint32Array | Uint16Array | Uint8Array;
  head: number;
  tail: number;
  free: Stack;
  initialFill: number;
  size: number;
  disposeAfter: Disposer<K, V> | null;
  disposed: any[] | null;
  noDisposeOnSet: boolean;
  noUpdateTTL: boolean;
  noDeleteOnFetchRejection: boolean;
  allowStale: boolean;
  noDeleteOnStaleGet: boolean;
  updateAgeOnGet: boolean;
  updateAgeOnHas: boolean;
  ttlResolution: number;
  ttlAutopurge: boolean;
  ttl: number;
  ttls?: ZeroArray;
  starts?: ZeroArray;
  calculatedSize?: number;
  sizes?: ZeroArray;
  dispose: Disposer<K, V> | undefined;
  updateItemAge?: (index: number) => void;
  removeItemSize?: (index: number) => void;
  addItemSize?: (index: number, size: number) => void;
  setItemTTL?: (index: number, ttl: number, start?: number) => void;

  constructor(options: Options<K, V>) {
    const {
      max = 0,
      ttl,
      ttlResolution = 1,
      ttlAutopurge,
      updateAgeOnGet,
      updateAgeOnHas,
      allowStale,
      dispose,
      disposeAfter,
      noDisposeOnSet,
      noUpdateTTL,
      maxSize = 0,
      sizeCalculation,
      fetchMethod,
      fetchContext,
      noDeleteOnFetchRejection,
      noDeleteOnStaleGet,
    } = options;

    if (max !== 0 && !isPosInt(max)) {
      throw new TypeError("max option must be a nonnegative integer");
    }

    const UintArray = max ? getUintArray(max) : Array;
    if (!UintArray) {
      throw new Error("invalid max value: " + max);
    }

    this.max = max;
    this.maxSize = maxSize;
    this.sizeCalculation = sizeCalculation;
    if (this.sizeCalculation) {
      if (!this.maxSize) {
        throw new TypeError(
          "cannot set sizeCalculation without setting maxSize",
        );
      }
      if (typeof this.sizeCalculation !== "function") {
        throw new TypeError("sizeCalculation set to non-function");
      }
    }

    this.fetchMethod = fetchMethod || null;
    if (this.fetchMethod && typeof this.fetchMethod !== "function") {
      throw new TypeError(
        "fetchMethod must be a function if specified",
      );
    }

    this.fetchContext = fetchContext;
    if (!this.fetchMethod && fetchContext !== undefined) {
      throw new TypeError(
        "cannot set fetchContext without fetchMethod",
      );
    }

    this.keyMap = new Map();
    this.keyList = new Array(max).fill(null);
    this.valList = new Array(max).fill(null);
    this.next = new UintArray(max);
    this.prev = new UintArray(max);
    this.head = 0;
    this.tail = 0;
    this.free = new Stack(max);
    this.initialFill = 1;
    this.size = 0;

    if (typeof dispose === "function") {
      this.dispose = dispose;
    }
    if (typeof disposeAfter === "function") {
      this.disposeAfter = disposeAfter;
      this.disposed = [];
    } else {
      this.disposeAfter = null;
      this.disposed = null;
    }
    this.noDisposeOnSet = !!noDisposeOnSet;
    this.noUpdateTTL = !!noUpdateTTL;
    this.noDeleteOnFetchRejection = !!noDeleteOnFetchRejection;

    if (this.maxSize !== 0) {
      if (!isPosInt(this.maxSize)) {
        throw new TypeError(
          "maxSize must be a positive integer if specified",
        );
      }
      this.initializeSizeTracking();
    }

    this.allowStale = !!allowStale;
    this.noDeleteOnStaleGet = !!noDeleteOnStaleGet;
    this.updateAgeOnGet = !!updateAgeOnGet;
    this.updateAgeOnHas = !!updateAgeOnHas;
    this.ttlResolution = isPosInt(ttlResolution) || ttlResolution === 0
      ? ttlResolution
      : 1;
    this.ttlAutopurge = !!ttlAutopurge;
    this.ttl = ttl || 0;
    if (this.ttl) {
      if (!isPosInt(this.ttl)) {
        throw new TypeError(
          "ttl must be a positive integer if specified",
        );
      }
      this.initializeTTLTracking();
    }

    // do not allow completely unbounded caches
    if (this.max === 0 && this.ttl === 0 && this.maxSize === 0) {
      throw new TypeError(
        "At least one of max, maxSize, or ttl is required",
      );
    }
    if (!this.ttlAutopurge && !this.max && !this.maxSize) {
      const code = "LRU_CACHE_UNBOUNDED";
      if (shouldWarn(code)) {
        warned.add(code);
        const msg = "TTL caching without ttlAutopurge, max, or maxSize can " +
          "result in unbounded memory consumption.";
        emitWarning(msg, "UnboundedCacheWarning", code, LRUCache);
      }
    }
  }

  getRemainingTTL(key: K): number {
    return this.has(key, { updateAgeOnHas: false }) ? Infinity : 0;
  }

  initializeTTLTracking() {
    this.ttls = new ZeroArray(this.max);
    this.starts = new ZeroArray(this.max);

    this.setItemTTL = (index, ttl, start = perf.now()) => {
      this.starts![index] = ttl !== 0 ? start : 0;
      this.ttls![index] = ttl;
      if (ttl !== 0 && this.ttlAutopurge) {
        setTimeout(() => {
          if (this.isStale(index)) {
            this.delete(this.keyList[index]);
          }
        }, ttl + 1);
      }
    };

    this.updateItemAge = (index: number) => {
      this.starts![index] = this.ttls![index] !== 0 ? perf.now() : 0;
    };

    // debounce calls to perf.now() to 1s so we're not hitting
    // that costly call repeatedly.
    let cachedNow = 0;
    const getNow = () => {
      const n = perf.now();
      if (this.ttlResolution > 0) {
        cachedNow = n;
        setTimeout(
          () => (cachedNow = 0),
          this.ttlResolution,
        );
      }
      return n;
    };

    this.getRemainingTTL = (key) => {
      const index = this.keyMap.get(key);
      if (index === undefined) {
        return 0;
      }
      return this.ttls![index] === 0 || this.starts![index] === 0
        ? Infinity
        : this.starts![index] +
          this.ttls![index] -
          (cachedNow || getNow());
    };

    this.isStale = (index) => {
      return (
        this.ttls![index] !== 0 &&
        this.starts![index] !== 0 &&
        (cachedNow || getNow()) - this.starts![index] >
          this.ttls![index]
      );
    };
  }

  isStale(index: number): boolean {
    return false;
  }

  initializeSizeTracking() {
    this.calculatedSize = 0;
    this.sizes = new ZeroArray(this.max);
    this.removeItemSize = (index) => {
      this.calculatedSize! -= this.sizes![index];
      this.sizes![index] = 0;
    };
    this.requireSize = (k, v, size, sizeCalculation) => {
      if (!isPosInt(size)) {
        if (sizeCalculation) {
          if (typeof sizeCalculation !== "function") {
            throw new TypeError("sizeCalculation must be a function");
          }
          size = sizeCalculation(v, k);
          if (!isPosInt(size)) {
            throw new TypeError(
              "sizeCalculation return invalid (expect positive integer)",
            );
          }
        } else {
          throw new TypeError(
            "invalid size value (must be positive integer)",
          );
        }
      }
      return size;
    };
    this.addItemSize = (index, size) => {
      this.sizes![index] = size;
      const maxSize = this.maxSize - this.sizes![index];
      while (this.calculatedSize! > maxSize) {
        this.evict(true);
      }
      this.calculatedSize += this.sizes![index];
    };
  }

  requireSize(
    k: K,
    v: V,
    size: number,
    sizeCalculation?: SizeCalculator<K, V>,
  ): number {
    if (size || sizeCalculation) {
      throw new TypeError(
        "cannot set size without setting maxSize on cache",
      );
    }
    return 0;
  }

  *indexes({ allowStale = this.allowStale } = {}) {
    if (this.size) {
      for (let i = this.tail; true;) {
        if (!this.isValidIndex(i)) {
          break;
        }
        if (allowStale || !this.isStale(i)) {
          yield i;
        }
        if (i === this.head) {
          break;
        } else {
          i = this.prev[i];
        }
      }
    }
  }

  *rindexes({ allowStale = this.allowStale } = {}) {
    if (this.size) {
      for (let i = this.head; true;) {
        if (!this.isValidIndex(i)) {
          break;
        }
        if (allowStale || !this.isStale(i)) {
          yield i;
        }
        if (i === this.tail) {
          break;
        } else {
          i = this.next[i];
        }
      }
    }
  }

  isValidIndex(index: number): boolean {
    return this.keyMap.get(this.keyList[index]) === index;
  }

  *entries() {
    for (const i of this.indexes()) {
      yield [this.keyList[i], this.valList[i]];
    }
  }
  *rentries() {
    for (const i of this.rindexes()) {
      yield [this.keyList[i], this.valList[i]];
    }
  }

  *keys() {
    for (const i of this.indexes()) {
      yield this.keyList[i];
    }
  }
  *rkeys() {
    for (const i of this.rindexes()) {
      yield this.keyList[i];
    }
  }

  *values() {
    for (const i of this.indexes()) {
      yield this.valList[i];
    }
  }
  *rvalues() {
    for (const i of this.rindexes()) {
      yield this.valList[i];
    }
  }

  [Symbol.iterator]() {
    return this.entries();
  }

  find<T = V>(
    fn: (
      value: V,
      key: K,
      cache: this,
    ) => boolean | undefined | void,
    options?: GetOptions,
  ): T | undefined {
    for (const i of this.indexes()) {
      if (fn(this.valList[i], this.keyList[i], this)) {
        return this.get(this.keyList[i], options);
      }
    }
  }

  public forEach<T = this>(
    fn: (this: T | undefined, value: V, key: K, cache: this) => void,
    thisArg?: T,
  ): void {
    for (const i of this.indexes()) {
      fn.call(thisArg, this.valList[i], this.keyList[i], this);
    }
  }

  rforEach<T = this>(
    fn: (this: T | undefined, value: V, key: K, cache: this) => void,
    thisArg?: T,
  ): void {
    for (const i of this.rindexes()) {
      fn.call(thisArg, this.valList[i], this.keyList[i], this);
    }
  }

  purgeStale() {
    let deleted = false;
    for (const i of this.rindexes({ allowStale: true })) {
      if (this.isStale(i)) {
        this.delete(this.keyList[i]);
        deleted = true;
      }
    }
    return deleted;
  }

  dump() {
    const arr = [];
    for (const i of this.indexes({ allowStale: true })) {
      const key = this.keyList[i];
      const v = this.valList[i];
      const value = this.isBackgroundFetch(v) ? v.__staleWhileFetching : v;
      const entry: any = { value };
      if (this.ttls) {
        entry.ttl = this.ttls[i];
        // always dump the start relative to a portable timestamp
        // it's ok for this to be a bit slow, it's a rare operation.
        const age = perf.now() - this.starts![i];
        entry.start = Math.floor(Date.now() - age);
      }
      if (this.sizes) {
        entry.size = this.sizes[i];
      }
      arr.unshift([key, entry]);
    }
    return arr;
  }

  load(arr: ReadonlyArray<[K, Entry<V>]>) {
    this.clear();
    for (const [key, entry] of arr) {
      if (entry.start) {
        // entry.start is a portable timestamp, but we may be using
        // node's performance.now(), so calculate the offset.
        // it's ok for this to be a bit slow, it's a rare operation.
        const age = Date.now() - entry.start;
        entry.start = perf.now() - age;
      }
      this.set(key, entry.value, entry);
    }
  }

  set(
    k: K,
    v: V,
    {
      ttl = this.ttl,
      start,
      noDisposeOnSet = this.noDisposeOnSet,
      size = 0,
      sizeCalculation = this.sizeCalculation,
      noUpdateTTL = this.noUpdateTTL,
    }: SetOptions<K, V> = {},
  ) {
    size = this.requireSize(k, v, size, sizeCalculation);
    // if the item doesn't fit, don't do anything
    if (this.maxSize && size > this.maxSize) {
      return this;
    }
    let index = this.size === 0 ? undefined : this.keyMap.get(k);
    if (index === undefined) {
      // addition
      index = this.newIndex();
      this.keyList[index] = k;
      this.valList[index] = v;
      this.keyMap.set(k, index);
      this.next[this.tail] = index;
      this.prev[index] = this.tail;
      this.tail = index;
      this.size++;
      this.addItemSize?.(index, size);
      noUpdateTTL = false;
    } else {
      // update
      const oldVal = this.valList[index];
      if (v !== oldVal) {
        if (this.isBackgroundFetch(oldVal)) {
          oldVal.__abortController.abort();
        } else {
          if (!noDisposeOnSet) {
            this.dispose?.(oldVal, k, "set");
            if (this.disposeAfter) {
              this.disposed?.push([oldVal, k, "set"]);
            }
          }
        }
        this.removeItemSize?.(index);
        this.valList[index] = v;
        this.addItemSize?.(index, size);
      }
      this.moveToTail(index);
    }
    if (ttl !== 0 && this.ttl === 0 && !this.ttls) {
      this.initializeTTLTracking();
    }
    if (!noUpdateTTL) {
      this.setItemTTL!(index, ttl, start);
    }
    if (this.disposeAfter) {
      while (this.disposed?.length) {
        this.disposeAfter.apply(this, this.disposed.shift());
      }
    }
    return this;
  }

  newIndex() {
    if (this.size === 0) {
      return this.tail;
    }
    if (this.size === this.max && this.max !== 0) {
      return this.evict(false);
    }
    if (this.free.length !== 0) {
      return this.free.pop();
    }
    // initial fill, just keep writing down the list
    return this.initialFill++;
  }

  pop() {
    if (this.size) {
      const val = this.valList[this.head];
      this.evict(true);
      return val;
    }
  }

  evict(free: boolean) {
    const head = this.head;
    const k = this.keyList[head];
    const v = this.valList[head];
    if (this.isBackgroundFetch(v)) {
      v.__abortController.abort();
    } else {
      this.dispose?.(v, k, "evict");
      if (this.disposeAfter) {
        this.disposed?.push([v, k, "evict"]);
      }
    }
    this.removeItemSize?.(head);
    // if we aren't about to use the index, then null these out
    if (free) {
      this.keyList[head] = null;
      this.valList[head] = null;
      this.free.push(head);
    }
    this.head = this.next[head];
    this.keyMap.delete(k);
    this.size--;
    return head;
  }

  has(k: K, { updateAgeOnHas = this.updateAgeOnHas } = {}) {
    const index = this.keyMap.get(k);
    if (index !== undefined) {
      if (!this.isStale(index)) {
        if (updateAgeOnHas) {
          this.updateItemAge?.(index);
        }
        return true;
      }
    }
    return false;
  }

  // like get(), but without any LRU updating or TTL expiration
  peek(k: K, { allowStale = this.allowStale } = {}) {
    const index = this.keyMap.get(k);
    if (index !== undefined && (allowStale || !this.isStale(index))) {
      const v = this.valList[index];
      // either stale and allowed, or forcing a refresh of non-stale value
      return this.isBackgroundFetch(v) ? v.__staleWhileFetching : v;
    }
  }

  backgroundFetch(
    k: K,
    index: number,
    options: FetchOptions<K, V>,
    context: any,
  ) {
    const v = index === undefined ? undefined : this.valList[index];
    if (this.isBackgroundFetch(v)) {
      return v;
    }
    const ac = new AC();
    const fetchOpts = {
      signal: ac.signal,
      options,
      context,
    };
    const cb = (v: V) => {
      if (!ac.signal.aborted) {
        this.set(k, v, fetchOpts.options);
      }
      return v;
    };
    const eb = (er: Error) => {
      if (this.valList[index] === p) {
        const del = !options.noDeleteOnFetchRejection ||
          p.__staleWhileFetching === undefined;
        if (del) {
          this.delete(k);
        } else {
          // still replace the *promise* with the stale value,
          // since we are done with the promise at this point.
          this.valList[index] = p.__staleWhileFetching;
        }
      }
      if (p.__returned === p) {
        throw er;
      }
    };
    const p: any = new Promise((resolve) => {
      resolve(this.fetchMethod?.(k, v, fetchOpts));
    }).then(cb as any, eb);
    p.__abortController = ac;
    p.__staleWhileFetching = v;
    p.__returned = null;
    if (index === undefined) {
      this.set(k, p, fetchOpts.options);
      index = this.keyMap.get(k);
    } else {
      this.valList[index] = p;
    }
    return p;
  }

  isBackgroundFetch(p: any) {
    return (
      p &&
      typeof p === "object" &&
      typeof p.then === "function" &&
      Object.prototype.hasOwnProperty.call(
        p,
        "__staleWhileFetching",
      ) &&
      Object.prototype.hasOwnProperty.call(p, "__returned") &&
      (p.__returned === p || p.__returned === null)
    );
  }

  // this takes the union of get() and set() opts, because it does both
  fetch<ExpectedValue = V>(
    k: K,
    {
      // get options
      allowStale = this.allowStale,
      updateAgeOnGet = this.updateAgeOnGet,
      noDeleteOnStaleGet = this.noDeleteOnStaleGet,
      // set options
      ttl = this.ttl,
      noDisposeOnSet = this.noDisposeOnSet,
      size = 0,
      sizeCalculation = this.sizeCalculation,
      noUpdateTTL = this.noUpdateTTL,
      // fetch exclusive options
      noDeleteOnFetchRejection = this.noDeleteOnFetchRejection,
      fetchContext = this.fetchContext,
      forceRefresh = false,
    }: FetchOptions<K, V> = {},
  ) {
    if (!this.fetchMethod) {
      return this.get(k, {
        allowStale,
        updateAgeOnGet,
        noDeleteOnStaleGet,
      });
    }

    const options = {
      allowStale,
      updateAgeOnGet,
      noDeleteOnStaleGet,
      ttl,
      noDisposeOnSet,
      size,
      sizeCalculation,
      noUpdateTTL,
      noDeleteOnFetchRejection,
    };

    const index = this.keyMap.get(k);
    if (index === undefined) {
      const p = this.backgroundFetch(k, index, options, fetchContext);
      return (p.__returned = p);
    } else {
      // in cache, maybe already fetching
      const v = this.valList[index];
      if (this.isBackgroundFetch(v)) {
        return allowStale && v.__staleWhileFetching !== undefined
          ? v.__staleWhileFetching
          : (v.__returned = v);
      }

      // if we force a refresh, that means do NOT serve the cached value,
      // unless we are already in the process of refreshing the cache.
      if (!forceRefresh && !this.isStale(index)) {
        this.moveToTail(index);
        if (updateAgeOnGet) {
          this.updateItemAge?.(index);
        }
        return v;
      }

      // ok, it is stale or a forced refresh, and not already fetching.
      // refresh the cache.
      const p = this.backgroundFetch(k, index, options, fetchContext);
      return allowStale && p.__staleWhileFetching !== undefined
        ? p.__staleWhileFetching
        : (p.__returned = p);
    }
  }

  get<T = V>(
    k: K,
    {
      allowStale = this.allowStale,
      updateAgeOnGet = this.updateAgeOnGet,
      noDeleteOnStaleGet = this.noDeleteOnStaleGet,
    }: GetOptions = {},
  ): T | undefined {
    const index = this.keyMap.get(k);
    if (index !== undefined) {
      const value = this.valList[index];
      const fetching = this.isBackgroundFetch(value);
      if (this.isStale(index)) {
        // delete only if not an in-flight background fetch
        if (!fetching) {
          if (!noDeleteOnStaleGet) {
            this.delete(k);
          }
          return allowStale ? value : undefined;
        } else {
          return allowStale ? value.__staleWhileFetching : undefined;
        }
      } else {
        // if we're currently fetching it, we don't actually have it yet
        // it's not stale, which means this isn't a staleWhileRefetching,
        // so we just return undefined
        if (fetching) {
          return undefined;
        }
        this.moveToTail(index);
        if (updateAgeOnGet) {
          this.updateItemAge?.(index);
        }
        return value;
      }
    }
  }

  connect(p: number, n: number) {
    this.prev[n] = p;
    this.next[p] = n;
  }

  moveToTail(index: number) {
    // if tail already, nothing to do
    // if head, move head to next[index]
    // else
    //   move next[prev[index]] to next[index] (head has no prev)
    //   move prev[next[index]] to prev[index]
    // prev[index] = tail
    // next[tail] = index
    // tail = index
    if (index !== this.tail) {
      if (index === this.head) {
        this.head = this.next[index];
      } else {
        this.connect(this.prev[index], this.next[index]);
      }
      this.connect(this.tail, index);
      this.tail = index;
    }
  }

  delete(k: K) {
    let deleted = false;
    if (this.size !== 0) {
      const index = this.keyMap.get(k);
      if (index !== undefined) {
        deleted = true;
        if (this.size === 1) {
          this.clear();
        } else {
          this.removeItemSize?.(index);
          const v = this.valList[index];
          if (this.isBackgroundFetch(v)) {
            v.__abortController.abort();
          } else {
            this.dispose?.(v, k, "delete");
            if (this.disposeAfter) {
              this.disposed?.push([v, k, "delete"]);
            }
          }
          this.keyMap.delete(k);
          this.keyList[index] = null;
          this.valList[index] = null;
          if (index === this.tail) {
            this.tail = this.prev[index];
          } else if (index === this.head) {
            this.head = this.next[index];
          } else {
            this.next[this.prev[index]] = this.next[index];
            this.prev[this.next[index]] = this.prev[index];
          }
          this.size--;
          this.free.push(index);
        }
      }
    }
    if (this.disposed) {
      while (this.disposed.length) {
        this.disposeAfter?.apply(this, this.disposed.shift());
      }
    }
    return deleted;
  }

  clear() {
    for (const index of this.rindexes({ allowStale: true })) {
      const v = this.valList[index];
      if (this.isBackgroundFetch(v)) {
        v.__abortController.abort();
      } else {
        const k = this.keyList[index];
        this.dispose?.(v, k, "delete");
        if (this.disposeAfter) {
          this.disposed?.push([v, k, "delete"]);
        }
      }
    }

    this.keyMap.clear();
    this.valList.fill(null);
    this.keyList.fill(null);
    if (this.ttls) {
      this.ttls.fill(0);
      this.starts!.fill(0);
    }
    if (this.sizes) {
      this.sizes.fill(0);
    }
    this.head = 0;
    this.tail = 0;
    this.initialFill = 1;
    this.free.length = 0;
    this.calculatedSize = 0;
    this.size = 0;
    if (this.disposed) {
      while (this.disposed.length) {
        this.disposeAfter?.apply(this, this.disposed.shift());
      }
    }
  }

  static get AbortController() {
    return AC;
  }
  static get AbortSignal() {
    return AS;
  }
}
