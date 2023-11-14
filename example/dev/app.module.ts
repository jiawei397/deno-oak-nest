// deno-lint-ignore-file no-unused-vars
import { APP_INTERCEPTOR, Module } from "@nest";
import { CacheModule } from "@nest/cache";
import { AppController } from "./app.controller.ts";
import { AsyncModule } from "./asyncModule/async.module.ts";
import { LoggingInterceptor } from "./interceptor/log.interceptor.ts";
import { UserModule } from "./user/user.module.ts";

// import { AuthGuard } from "./guards/auth.guard.ts";
// import { RoleService } from "./user/services/role.service.ts";

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
    // RoleService,
  ],
})
export class AppModule {}
