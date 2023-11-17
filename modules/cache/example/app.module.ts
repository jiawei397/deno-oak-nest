import { Module } from "@nest";
import { CacheModule } from "@nest/cache";
import { AppController } from "./app.controller.ts";
import { KVStore } from "../src/cache.store.ts";

@Module({
  imports: [
    CacheModule.register({
      ttl: 60,
      // max: 2,
      isDebug: true,
      // policy: "public",
      // store: "localStorage",
      store: async () => {
        const store = new KVStore();
        await store.init("cacheModule");
        return {
          name: "KVStore",
          store,
        };
      },
    }),
  ],
  controllers: [AppController],
})
export class AppModule {}
