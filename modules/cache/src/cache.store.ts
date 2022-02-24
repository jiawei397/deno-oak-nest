// deno-lint-ignore-file no-explicit-any
import { CacheStore } from "./cache.interface.ts";

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
      try {
        return JSON.parse(val);
      } catch {
        return val;
      }
    }
  }
  set(key: string, value: any, options?: { ttl: number }) {
    localStorage.setItem(
      key,
      typeof value === "object" ? JSON.stringify(value) : value,
    );
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
