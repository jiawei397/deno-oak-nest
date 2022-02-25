// deno-lint-ignore-file no-explicit-any
import { CacheStore, LocalValue } from "./cache.interface.ts";

export class MemoryStore implements CacheStore {
  cache: Map<string, any>;
  timeoutMap: Map<string, number>;
  constructor() {
    this.cache = new Map();
    this.timeoutMap = new Map<string, number>();
  }
  get<T = any>(key: string): T {
    return this.cache.get(key);
  }
  set(key: string, value: any, options?: { ttl: number }) {
    this.cache.set(key, value);
    if (options?.ttl) {
      const st = setTimeout(() => {
        this.delete(key);
      }, options.ttl * 1000);
      this.timeoutMap.set(key, st);
    }
  }
  delete(key: string) {
    this.cache.delete(key);
    clearTimeout(this.timeoutMap.get(key));
    this.timeoutMap.delete(key);
  }
  clear(): void | Promise<void> {
    this.cache.clear();
    for (const st of this.timeoutMap.values()) {
      clearTimeout(st);
    }
    this.timeoutMap.clear();
  }
  has(key: string): boolean | Promise<boolean> {
    return this.cache.has(key);
  }
  size(): number | Promise<number> {
    return this.cache.size;
  }
}

export class LocalStore implements CacheStore {
  timeoutMap: Map<string, number>;

  constructor() {
    this.timeoutMap = new Map<string, number>();
  }

  get(key: string) {
    const val = localStorage.getItem(key);
    if (val) {
      const json = JSON.parse(val) as LocalValue;
      // console.log("get json", json);
      if (json.td && Date.now() >= json.td) { // expired
        // console.debug(`Cache expired: ${key} and will be deleted`);
        this.delete(key);
        return;
      }
      return json.value;
    }
  }
  set(key: string, value: any, options?: { ttl: number }) {
    const val: LocalValue = {
      td: options?.ttl ? Date.now() + options.ttl * 1000 : undefined,
      value,
    };
    localStorage.setItem(key, JSON.stringify(val));
    if (options?.ttl) {
      setTimeout(() => {
        this.delete(key);
      }, options.ttl * 1000);
    }
  }
  delete(key: string) {
    localStorage.removeItem(key);
    clearTimeout(this.timeoutMap.get(key));
    this.timeoutMap.delete(key);
  }
  clear(): void | Promise<void> {
    localStorage.clear();
    for (const st of this.timeoutMap.values()) {
      clearTimeout(st);
    }
    this.timeoutMap.clear();
  }
  has(key: string): boolean | Promise<boolean> {
    return localStorage.getItem(key) !== null;
  }
  size(): number | Promise<number> {
    return localStorage.length;
  }
}
