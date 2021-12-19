import { Module, ScheduleModule } from "../mod.ts";
import { CacheModule } from "../src/cache/cache.mod.ts";
import { AppController } from "./app.controller.ts";
import { AsyncModule } from "./asyncModule/async.module.ts";
import { UserModule } from "./user/user.module.ts";

@Module({
  imports: [
    // ScheduleModule.forRoot(),
    CacheModule.register({
      ttl: 60,
    }),
    UserModule,
    AsyncModule.register("localhost:4878"),
  ],
  controllers: [AppController],
})
export class AppModule {}
