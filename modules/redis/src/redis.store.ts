// deno-lint-ignore-file no-explicit-any
import { assert, factory, Inject } from "@nest/core";
import type { ICacheStore } from "@nest/cache";
import type { Redis } from "../deps.ts";
import { REDIS_KEY, REDIS_STORE_NAME } from "./redis.constant.ts";
import { jsonParse, stringify } from "./utils.ts";

export class RedisStore implements ICacheStore {
  key = "cache_store";
  timeoutMap: Map<string, number>;
  constructor(@Inject(REDIS_KEY) public readonly client: Redis) {
    assert(this.client, "redis client should be inited");
    this.timeoutMap = new Map<string, number>();
    this.clear().catch(console.error);
  }

  async get<T = any>(key: string): Promise<T | undefined> {
    const newKey = this.getNewKey(key);
    const data = await this.client.get(newKey);
    return jsonParse(data);
  }

  getNewKey(key: string) {
    return this.key + "_" + key;
  }

  async set(
    key: string,
    value: any,
    options?: { ttl: number },
  ): Promise<string> {
    const newKey = this.getNewKey(key);
    await this.client.sadd(this.key, key);

    if (options?.ttl) {
      const st = setTimeout(() => {
        this.client.srem(this.key, key).catch(console.error);
      }, options.ttl * 1000);
      this.timeoutMap.set(key, st);
    }
    return this.client.set(
      newKey,
      stringify(value),
      options
        ? {
          ex: options.ttl,
        }
        : undefined,
    );
  }
  async delete(key: string) {
    const newKey = this.getNewKey(key);
    const result = await this.client.del(newKey);
    await this.client.srem(this.key, key);
    this.timeoutMap.delete(key);
    return result;
  }
  async clear() {
    const keys = await this.client.smembers(this.key);
    await this.client.del(this.key);
    await Promise.all(keys.map((key) => this.client.del(this.getNewKey(key))));
    for (const st of this.timeoutMap.values()) {
      clearTimeout(st);
    }
  }
  async has(key: string) {
    const newKey = this.getNewKey(key);
    const num = await this.client.exists(newKey);
    return num === 1;
  }
  size() {
    return this.client.scard(this.key);
  }
}

export const createStore = async () => {
  return {
    name: REDIS_STORE_NAME,
    store: await factory.create(RedisStore),
  };
};
