// deno-lint-ignore-file no-explicit-any
import { Module } from "../decorators/module.ts";
import { ModuleMetadata } from "../interfaces/module.interface.ts";
import { Provide } from "../interfaces/provider.interface.ts";
import { Constructor, Instance, Type } from "../interfaces/type.interface.ts";
import { Factory, getInstance } from "./class.factory.ts";
import { NestFactory } from "./nest.factory.ts";

export class TestModule {
  factoryCaches = new Map();
  data: ModuleMetadata;

  constructor(data: ModuleMetadata) {
    this.data = data;
  }

  get<T extends Instance>(constructor: Type<T>) {
    return Factory<T>(constructor, undefined, this.factoryCaches);
  }
  resolve(constructor: Constructor) {
    return getInstance(constructor, undefined, this.factoryCaches);
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

    await NestFactory.create(AppModule, this.factoryCaches);
    return this;
  }
}

export function createTestingModule(data: ModuleMetadata) {
  return new TestModule(data);
}
