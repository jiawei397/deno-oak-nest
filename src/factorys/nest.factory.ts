// deno-lint-ignore-file no-explicit-any
import { Reflect } from "../../deps.ts";
import { Application } from "../application.ts";
import { getModuleMetadata, isModule } from "../decorators/module.ts";
import type { ModuleType, Provider, Type } from "../interfaces/mod.ts";
import { Scope } from "../interfaces/mod.ts";
import { globalFactoryCaches, initProvider } from "./class.factory.ts";

const onModuleInitedKey = Symbol("onModuleInited");

export async function findControllers(
  module: ModuleType,
  controllerArr: Type<any>[],
  registeredProviders: Provider[],
  dynamicProviders: Provider[],
  specialProviders: Provider[],
) {
  if (!isModule(module)) {
    return;
  }
  const isDynamicModule = "module" in module;
  const imports = isDynamicModule
    ? module.imports
    : getModuleMetadata("imports", module);

  const controllers = isDynamicModule
    ? module.controllers
    : getModuleMetadata("controllers", module);
  const providers: Provider[] = isDynamicModule
    ? module.providers
    : getModuleMetadata("providers", module);
  // const exports = isDynamicModule
  //   ? module.exports
  //   : getModuleMetadata("exports", module); // TODO don't think well how to use exports
  if (controllers) {
    controllerArr.push(...controllers);
  }
  if (providers) {
    if (isDynamicModule) {
      dynamicProviders.push(...providers);
    } else {
      providers.forEach((provider) => {
        if ("provide" in provider) {
          specialProviders.push(provider);
        } else {
          registeredProviders.push(provider);
        }
      });
    }
  }
  if (!imports || !imports.length) {
    return;
  }
  await Promise.all(imports.map(async (item: any) => {
    if (!item) {
      return;
    }
    const module = await item;
    return findControllers(
      module,
      controllerArr,
      registeredProviders,
      dynamicProviders,
      specialProviders,
    );
  }));
}

export async function initProviders(
  providers: Provider[],
  cache = globalFactoryCaches,
) {
  const arr = [];
  for (const provider of providers) {
    const instance = await initProvider(provider, Scope.DEFAULT, cache);
    if (instance) {
      arr.push({
        instance,
        provider,
      });
    }
  }
  return Promise.all(arr.map(({ instance, provider }) => {
    if (typeof instance.onModuleInit === "function") {
      if (Reflect.hasOwnMetadata(onModuleInitedKey, provider)) {
        return;
      }
      Reflect.defineMetadata(onModuleInitedKey, true, provider);
      return instance.onModuleInit();
    }
  }));
}

export class NestFactory {
  static async create(module: ModuleType, cache = globalFactoryCaches) {
    const app = new Application();
    const controllers: Type<any>[] = [];
    const registeredProviders: Provider<any>[] = [];
    const dynamicProviders: Provider<any>[] = [];
    const specialProviders: Provider<any>[] = [];
    await findControllers(
      module,
      controllers,
      registeredProviders,
      dynamicProviders,
      specialProviders,
    );
    await initProviders(specialProviders, cache);
    await initProviders(dynamicProviders, cache); // init dynamic providers first to avoid it be inited first by other providers
    await initProviders(registeredProviders, cache);

    if (controllers.length) {
      app.defaultCache = cache;
      await app.add(...controllers);
    }

    return app;
  }
}
