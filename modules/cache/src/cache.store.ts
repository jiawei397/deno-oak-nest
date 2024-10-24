// deno-lint-ignore-file no-explicit-any
import type { ICacheStore, LocalValue } from "./cache.interface.ts";

export class MemoryStore implements ICacheStore {
  cache: Map<string, any>;
  timeoutMap: Map<string, number>;
  ttl?: number;

  constructor(options?: { ttl?: number }) {
    this.cache = new Map();
    this.timeoutMap = new Map<string, number>();
    this.ttl = options?.ttl;
  }
  get<T = any>(key: string): T {
    return this.cache.get(key);
  }
  set(key: string, value: any, options?: { ttl: number }) {
    this.cache.set(key, value);
    const ttl = options?.ttl ?? this.ttl;
    if (ttl) {
      const st = setTimeout(() => {
        this.delete(key);
      }, ttl * 1000);
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

export class LocalStore implements ICacheStore {
  timeoutMap: Map<string, number>;
  ttl?: number;

  constructor(options?: { ttl?: number }) {
    this.timeoutMap = new Map<string, number>();
    this.ttl = options?.ttl;
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
    const ttl = options?.ttl ?? this.ttl;
    const val: LocalValue = {
      td: ttl ? Date.now() + ttl * 1000 : undefined,
      value,
    };
    localStorage.setItem(key, JSON.stringify(val));
    if (ttl) {
      const st = setTimeout(() => {
        this.delete(key);
      }, ttl * 1000);
      this.timeoutMap.set(key, st);
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

export class KVStore implements ICacheStore {
  kv: Deno.Kv;
  ttl?: number;
  baseKey: string;

  constructor(options?: {
    ttl?: number;
    baseKey?: string;
  }) {
    this.ttl = options?.ttl;
    this.baseKey = options?.baseKey ?? "KVStore";
  }

  async init() {
    this.kv = await Deno.openKv();
  }

  async get<T = any>(key: string): Promise<T | undefined> {
    const res = await this.kv.get([this.baseKey, key]);
    return (res.value ?? undefined) as T;
  }

  async set(key: string, value: any, options?: { ttl: number } | undefined) {
    const ttl = options?.ttl ?? this.ttl;
    await this.kv.set([this.baseKey, key], value, {
      expireIn: ttl ? ttl * 1000 : undefined,
    });
  }

  async delete(key: string) {
    await this.kv.delete([this.baseKey, key]);
  }

  async clear() {
    const entries = this.kv.list({ prefix: [this.baseKey] });
    for await (const entry of entries) {
      await this.kv.delete(entry.key);
    }
  }

  async has(key: string): Promise<boolean> {
    const res = await this.kv.get([this.baseKey, key]);
    return res.value !== null;
  }

  /**
   * @warning It is not a good idea to use this method in production.
   */
  async size(): Promise<number> {
    const entries = this.kv.list({ prefix: [this.baseKey] });
    let count = 0;
    for await (const _entry of entries) {
      count++;
    }
    return count;
  }

  close() {
    this.kv.close();
  }
}
