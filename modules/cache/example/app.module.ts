import { Module } from "@nest";
import { CacheModule } from "@nest/cache";
import { AppController } from "./app.controller.ts";

@Module({
  imports: [
    CacheModule.register({
      // ttl: 60,
      max: 2,
      isDebug: true,
      // policy: "public",
      // store: "localStorage",
      store: "KVStore",
    }),
  ],
  controllers: [AppController],
})
export class AppModule {}
