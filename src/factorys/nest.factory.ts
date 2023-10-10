// deno-lint-ignore-file no-explicit-any
import { Reflect } from "../../deps.ts";
import { Application } from "../application.ts";
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from "../constants.ts";
import { getModuleMetadata, isModule } from "../decorators/module.ts";
import type {
  IRouter,
  ModuleType,
  Provider,
  RegisteredProvider,
  SpecialProvider,
  Type,
} from "../interfaces/mod.ts";
import { Scope } from "../interfaces/mod.ts";
import { globalFactoryCaches, initProvider } from "./class.factory.ts";

const onModuleInitedKey = Symbol("onModuleInited");

export async function findControllers(
  module: ModuleType,
  controllerArr: Type<any>[],
  registeredProviders: RegisteredProvider[],
  dynamicProviders: Provider[],
  specialProviders: SpecialProvider[],
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
  app: Application,
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
  await Promise.all(arr.map(({ instance, provider }) => {
    // register global interceptor, filter, guard
    if ("provide" in provider) {
      const provide = provider.provide;
      if (provide === APP_INTERCEPTOR) {
        app.useGlobalInterceptors(instance);
      } else if (provide === APP_FILTER) {
        app.useGlobalFilters(instance);
      } else if (provide === APP_GUARD) {
        app.useGlobalGuards(instance);
      }
    }

    // init module
    if (typeof instance.onModuleInit === "function") {
      if (Reflect.hasOwnMetadata(onModuleInitedKey, provider)) {
        return;
      }
      Reflect.defineMetadata(onModuleInitedKey, true, provider);
      return instance.onModuleInit();
    }
  }));
  return arr;
}

export class NestFactory {
  static async create(
    module: ModuleType,
    router: IRouter,
    cache = globalFactoryCaches,
  ) {
    const app = new Application(router);
    const controllers: Type<any>[] = [];
    const registeredProviders: RegisteredProvider[] = [];
    const dynamicProviders: Provider[] = [];
    const specialProviders: SpecialProvider[] = [];
    await findControllers(
      module,
      controllers,
      registeredProviders,
      dynamicProviders,
      specialProviders,
    );
    await initProviders(specialProviders, app, cache);
    await initProviders(dynamicProviders, app, cache); // init dynamic providers first to avoid it be inited first by other providers
    await initProviders(registeredProviders, app, cache);

    if (controllers.length) {
      app.defaultCache = cache;
      await app.add(...controllers);
    }

    return app;
  }
}
