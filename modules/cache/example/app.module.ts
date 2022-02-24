import { Module } from "../../../mod.ts";
import { CacheModule } from "../mod.ts";
import { AppController } from "./app.controller.ts";

@Module({
  imports: [
    CacheModule.register({
      ttl: 6,
      policy: "public",
      // store: "localStorage",
    }),
  ],
  controllers: [AppController],
})
export class AppModule {}
