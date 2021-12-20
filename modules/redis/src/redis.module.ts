import { connect, Redis, RedisConnectOptions, yellow } from "../deps.ts";
import { REDIS_KEY } from "./redis.constant.ts";
import { RedisService } from "./redis.service.ts";
import { stringify } from "./utils.ts";

export class RedisModule {
  static client: Redis;

  static forRoot(db: RedisConnectOptions) {
    return {
      module: RedisModule,
      providers: [{
        provide: REDIS_KEY,
        useFactory: async () => { // can be async
          const client = await connect(db);
          console.info("connect to redis success", yellow(stringify(db)));
          this.client = client;
          return client;
        },
      }, RedisService],
    };
  }

  static getClient() {
    return this.client;
  }
}
