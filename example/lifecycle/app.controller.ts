import {
  BeforeApplicationShutdown,
  Controller,
  Get,
  OnApplicationBootstrap,
  OnApplicationShutdown,
  OnModuleDestroy,
  OnModuleInit,
} from "@nest";
import { AppService } from "./app.service.ts";

@Controller("")
export class AppController
  implements
    OnModuleInit,
    OnApplicationBootstrap,
    OnApplicationShutdown,
    BeforeApplicationShutdown,
    OnModuleDestroy {
  constructor(private readonly appService: AppService) {
  }
  beforeApplicationShutdown(signal?: string): void | Promise<void> {
    console.log("beforeApplicationShutdown AppController", signal);
  }
  onModuleDestroy(): void | Promise<void> {
    console.log("onModuleDestroy AppController");
  }

  onModuleInit(): void | Promise<void> {
    console.log("onModuleInit AppController");
  }

  onApplicationBootstrap() {
    console.log("onApplicationBootstrap AppController");
  }

  onApplicationShutdown(signal?: string) {
    console.log("onApplicationShutdown AppController", signal);
  }

  @Get("/")
  hello() {
    return this.appService.hello();
  }
}
