// deno-lint-ignore-file no-explicit-any
import { Factory } from "../../../src/factorys/class.factory.ts";
import { CacheStore } from "../../cache/src/cache.interface.ts";
import { Inject } from "../deps.ts";
import type { Redis } from "../deps.ts";
import { REDIS_KEY, REDIS_STORE_NAME } from "./redis.constant.ts";
import { jsonParse, stringify } from "./utils.ts";

export class RedisStore implements CacheStore {
  key = "cache_store";
  constructor(@Inject(REDIS_KEY) public readonly client: Redis) {
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
      setTimeout(() => {
        this.client.srem(this.key, key).catch(console.error);
      }, options.ttl * 1000);
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
    return result;
  }
  async clear() {
    const keys = await this.client.smembers(this.key);
    await Promise.all(keys.map((key) => this.client.del(this.getNewKey(key))));
    return this.client.del(this.key);
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
    store: await Factory(RedisStore),
  };
};
