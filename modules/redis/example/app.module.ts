import { Module } from "./deps.ts";
import { AppController } from "./app.controller.ts";
import { createStore, RedisModule } from "../mod.ts";
import { CacheModule } from "../../cache/mod.ts";

@Module({
  imports: [
    RedisModule.forRoot({
      port: 6379,
      hostname: "192.168.21.176",
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
