import { APP_INTERCEPTOR, Module } from "@nest/core";
import { AppController } from "./app.controller.ts";
import { LoggingInterceptor } from "./interceptor.ts";

@Module({
  controllers: [AppController],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule {}
