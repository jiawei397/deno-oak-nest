// deno-lint-ignore-file no-unused-vars
import { APP_INTERCEPTOR, Module } from "../mod.ts";
import { CacheModule } from "../modules/cache/mod.ts";
import { AppController } from "./app.controller.ts";
import { AsyncModule } from "./asyncModule/async.module.ts";
import { LoggingInterceptor } from "./interceptor/log.interceptor.ts";
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
  providers: [
    // {
    //   provide: APP_INTERCEPTOR,
    //   useClass: LoggingInterceptor,
    //   // useValue: new LoggingInterceptor(),
    // },
  ],
})
export class AppModule {}
