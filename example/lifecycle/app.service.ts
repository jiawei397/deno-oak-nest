import {
  BeforeApplicationShutdown,
  Injectable,
  OnApplicationBootstrap,
  OnApplicationShutdown,
  OnModuleDestroy,
  OnModuleInit,
} from "@nest";

@Injectable()
export class AppService
  implements
    OnModuleInit,
    OnApplicationBootstrap,
    OnApplicationShutdown,
    BeforeApplicationShutdown,
    OnModuleDestroy {
  hello() {
    return "Hello World!";
  }

  onModuleInit() {
    console.log("onModuleInit AppService");
  }

  onApplicationBootstrap() {
    console.log("onApplicationBootstrap AppService");
  }

  onApplicationShutdown(signal?: string) {
    console.log("onApplicationShutdown AppService", signal);
  }

  beforeApplicationShutdown(signal?: string) {
    console.log("beforeApplicationShutdown AppService", signal);
  }

  onModuleDestroy() {
    console.log("onModuleDestroy AppService");
  }
}
