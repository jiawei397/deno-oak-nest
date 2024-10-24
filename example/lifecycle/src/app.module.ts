import {
  BeforeApplicationShutdown,
  Module,
  OnApplicationBootstrap,
  OnApplicationShutdown,
  OnModuleDestroy,
  OnModuleInit,
} from "@nest/core";
import { AppController } from "./app.controller.ts";
import { AppService } from "./app.service.ts";

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule
  implements
    OnModuleInit,
    OnApplicationBootstrap,
    OnApplicationShutdown,
    BeforeApplicationShutdown,
    OnModuleDestroy {
  onModuleInit() {
    console.log("onModuleInit AppModule");
  }

  onApplicationBootstrap() {
    console.log("onApplicationBootstrap AppModule");
  }

  onApplicationShutdown(signal?: string) {
    console.log("onApplicationShutdown AppModule", signal);
  }

  beforeApplicationShutdown(signal?: string) {
    console.log("beforeApplicationShutdown AppModule", signal);
  }

  onModuleDestroy() {
    console.log("onModuleDestroy AppModule");
  }
}
