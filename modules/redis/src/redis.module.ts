import { red, yellow } from "../../../deps.ts";
import { Module } from "../../../src/decorators/module.ts";
import { type DynamicModule } from "../../../src/interfaces/module.interface.ts";
import { connect, type RedisConnectOptions } from "../deps.ts";
import type { Redis } from "../deps.ts";
import { REDIS_KEY } from "./redis.constant.ts";
import { RedisService } from "./redis.service.ts";
import { RedisStore } from "./redis.store.ts";

@Module({})
export class RedisModule {
  static client: Redis;

  static forRoot(db: RedisConnectOptions): DynamicModule {
    return {
      module: RedisModule,
      providers: [
        {
          provide: REDIS_KEY,
          useFactory: async () => { // can be async
            try {
              const client = await connect(db);
              console.info(
                "connect to redis success",
                yellow(
                  `hostname: ${db.hostname}, port: ${db.port}, database: ${db.db}`,
                ),
              );
              this.client = client;
              return client;
            } catch (e) {
              console.error("connect to redis error", red(e.stack));
            }
          },
        },
        RedisService,
        RedisStore,
      ],
      exports: [REDIS_KEY, RedisService, RedisStore],
      global: true,
    };
  }

  static getClient() {
    return this.client;
  }
}
