// deno-lint-ignore-file no-explicit-any
import { findUnusedPort, MockRouter } from "./common_helper.ts";
import {
  factory,
  META_EXCEPTION_FILTER_KEY,
  META_GUARD_KEY,
  META_INTERCEPTOR_KEY,
  Module,
  NestFactory,
  Reflect,
} from "@nest/core";
import type {
  Application,
  Constructor,
  ExceptionFilter,
  Instance,
  ModuleMetadata,
  ModuleType,
  NestGuard,
  NestInterceptor,
  Provide,
  Type,
} from "@nest/core";
import { HonoRouter } from "@nest/hono";

export class TestModule {
  factoryCaches = new Map();
  data: ModuleMetadata;
  app: Application;
  rootModule: Constructor;
  overrideInterceptorMap:
    | Map<
      NestInterceptor | Constructor<NestInterceptor>,
      NestInterceptor | Constructor<NestInterceptor>
    >
    | undefined;

  overrideFilterMap:
    | Map<
      ExceptionFilter | Constructor<ExceptionFilter>,
      ExceptionFilter | Constructor<ExceptionFilter>
    >
    | undefined;

  overrideGuardMap:
    | Map<NestGuard, NestGuard>
    | undefined;

  constructor(data: ModuleMetadata) {
    this.data = data;
  }

  async get<T extends Instance>(
    constructor: Type<T>,
    parentClass?: Type<any>,
  ): Promise<T | null> {
    const app = await this.getApp();
    const map = app.moduleCaches.get(this.rootModule)!;
    if (parentClass) {
      const parent = await map.get(parentClass);
      if (!parent) {
        return null;
      }
      for (const key in parent) {
        if (parent[key] instanceof constructor) {
          return parent[key];
        }
      }
      return null;
    }
    return map.get(constructor) || null;
  }
  async resolve(constructor: Constructor, parentClass?: Type<any>) {
    await this.getApp();
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

  overrideModule(module: ModuleType, value: ModuleType) {
    const data = this.data;
    if (!data.imports) {
      return this;
    }
    const index = data.imports.findIndex((item) => item === module);
    if (index !== -1) {
      data.imports[index] = value;
    }
    return this;
  }

  overrideInterceptor(
    interceptor: NestInterceptor | Constructor<NestInterceptor>,
    value: NestInterceptor | Constructor<NestInterceptor>,
  ) {
    this.overrideInterceptorMap = this.overrideInterceptorMap || new Map();
    this.overrideInterceptorMap.set(interceptor, value);
    return this;
  }

  overrideFilter(
    filter: ExceptionFilter | Constructor<ExceptionFilter>,
    value: ExceptionFilter | Constructor<ExceptionFilter>,
  ) {
    this.overrideFilterMap = this.overrideFilterMap || new Map();
    this.overrideFilterMap.set(filter, value);
    return this;
  }

  overrideGuard(guard: NestGuard, value: NestGuard) {
    this.overrideGuardMap = this.overrideGuardMap || new Map();
    this.overrideGuardMap.set(guard, value);
    return this;
  }

  private async overrideGuardOrInterceptorOrFilter<T>(
    filter: T | Constructor<T>,
    value: T | Constructor<T>,
    key: symbol,
  ) {
    const controllers = this.data.controllers;
    if (!controllers) {
      return this;
    }
    await Promise.all(controllers.map(async (controller) => {
      const instance = await this.get(controller);
      if (!instance) {
        return;
      }
      const arr = Reflect.getMetadata(
        key,
        instance,
      ) as Array<T | Constructor<T>> | null;
      if (arr) {
        const index = arr.findIndex((item) => item === filter);
        if (index !== -1) {
          arr[index] = value;
        }
      }
      Object.getOwnPropertyNames(Object.getPrototypeOf(instance)).forEach(
        (name) => {
          if (typeof instance[name] !== "function" || name === "constructor") {
            return;
          }
          const arr = Reflect.getMetadata(key, instance[name]) as
            | Array<T | Constructor<T>>
            | null;
          if (arr) {
            const index = arr.findIndex((item) => item === filter);
            if (index !== -1) {
              arr[index] = value;
            }
          }
        },
      );
    }));
    return this;
  }

  private async getApp() {
    if (this.app) {
      return this.app;
    }
    this.app = await NestFactory.create(this.rootModule, MockRouter, {
      cache: this.factoryCaches,
    });
    return this.app;
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

    if (this.overrideFilterMap) {
      for (const [filter, value] of this.overrideFilterMap) {
        await this.overrideGuardOrInterceptorOrFilter(
          filter,
          value,
          META_EXCEPTION_FILTER_KEY,
        );
      }
    }
    if (this.overrideInterceptorMap) {
      for (const [interceptor, value] of this.overrideInterceptorMap) {
        await this.overrideGuardOrInterceptorOrFilter(
          interceptor,
          value,
          META_INTERCEPTOR_KEY,
        );
      }
    }

    if (this.overrideGuardMap) {
      for (const [guard, value] of this.overrideGuardMap) {
        await this.overrideGuardOrInterceptorOrFilter(
          guard,
          value,
          META_GUARD_KEY,
        );
      }
    }

    return this;
  }

  createNestApplication() {
    this.factoryCaches.clear();
    return new App(this.rootModule, this.factoryCaches);
  }
}

export class App {
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
