import {
  BeforeApplicationShutdown,
  Module,
  OnApplicationBootstrap,
  OnApplicationShutdown,
  OnModuleDestroy,
  OnModuleInit,
} from "@nest";
import { AppController } from "./app.controller.ts";

@Module({
  imports: [],
  controllers: [AppController],
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

  onApplicationShutdown() {
    console.log("onApplicationShutdown AppModule");
  }

  beforeApplicationShutdown() {
    console.log("beforeApplicationShutdown AppModule");
  }

  onModuleDestroy() {
    console.log("onModuleDestroy AppModule");
  }
}
