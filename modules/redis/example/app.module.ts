import { Module } from "@nest";
import { createStore, RedisModule } from "@nest/redis";
import { CacheModule } from "@nest/cache";
import { AppController } from "./app.controller.ts";

@Module({
  imports: [
    RedisModule.forRoot({
      port: 6379,
      hostname: "192.168.21.176",
      db: 1,
      // password: "123456",
    }),
    CacheModule.register({
      ttl: 30,
      store: createStore,
      // defaultStore: "localStorage",
      defaultStore: "memory",
    }),
  ],
  controllers: [AppController],
})
export class AppModule {}
