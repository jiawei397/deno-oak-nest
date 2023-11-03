// deno-lint-ignore-file no-explicit-any
import { findUnusedPort, MockRouter } from "./common_helper.ts";
import { Module } from "../src/decorators/module.ts";
import type { ModuleMetadata } from "../src/interfaces/module.interface.ts";
import type { Provide } from "../src/interfaces/provider.interface.ts";
import type {
  Constructor,
  Instance,
  Type,
} from "../src/interfaces/type.interface.ts";
import { factory } from "../src/factorys/class.factory.ts";
import { NestFactory } from "../src/factorys/nest.factory.ts";
import { Application } from "../src/application.ts";
import { HonoRouter } from "../modules/hono/mod.ts";

export class TestModule {
  factoryCaches = new Map();
  data: ModuleMetadata;

  app: Application;
  rootModule: Constructor;

  constructor(data: ModuleMetadata) {
    this.data = data;
  }

  get<T extends Instance>(constructor: Type<T>): Promise<T> | null {
    const map = this.app.moduleCaches.get(this.rootModule)!;
    return map.get(constructor) || null;
  }
  resolve(constructor: Constructor, parentClass?: Type<any>) {
    return factory.getInstance(constructor, { parentClass });
  }
  overrideProvider(provide: Provide, value: any) {
    const data = this.data;
    if (!data.providers) {
      data.providers = [];
    }
    data.providers.push({
      provide,
      useValue: value,
    });
    return this;
  }
  async compile() {
    const data = this.data;

    @Module({
      imports: data.imports,
      controllers: data.controllers,
      providers: data.providers,
    })
    class AppModule {}

    this.rootModule = AppModule;
    this.app = await NestFactory.create(AppModule, MockRouter, {
      cache: this.factoryCaches,
    });
    return this;
  }

  createNestApplication() {
    this.factoryCaches.clear();
    return new App(this.rootModule, this.factoryCaches);
  }
}

class App {
  app: Application;
  port: number;
  constructor(
    public rootModule: Constructor,
    public factoryCaches: Map<any, any>,
  ) {}
  async init() {
    const app = await NestFactory.create(this.rootModule, HonoRouter, {
      cache: this.factoryCaches,
    });
    const port = await findUnusedPort(3000);
    await app.listen({ port });
    this.app = app;
    this.port = port;
  }

  async close() {
    await this.app.close();
  }
}

export function createTestingModule(data: ModuleMetadata) {
  return new TestModule(data);
}
