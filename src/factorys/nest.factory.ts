// deno-lint-ignore-file no-explicit-any
import { Reflect } from "../../deps.ts";
import { Application } from "../application.ts";
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from "../constants.ts";
import {
  getModuleMetadata,
  isDynamicModule,
  isModule,
} from "../decorators/module.ts";
import type {
  FactoryCreateOptions,
  IRouterConstructor,
  ModuleType,
  Provider,
  RegisteredProvider,
  SpecialProvider,
  Type,
} from "../interfaces/mod.ts";
import { Scope } from "../interfaces/mod.ts";
import { Factory, globalFactoryCaches, initProvider } from "./class.factory.ts";

const onModuleInitedKey = Symbol("onModuleInited");

export async function findControllers(
  rootModule: ModuleType,
  moduleArr: ModuleType[],
  controllerArr: Type<any>[],
  registeredProviders: RegisteredProvider[],
  dynamicProviders: Provider[],
  specialProviders: SpecialProvider[],
) {
  if (!isModule(rootModule)) {
    return;
  }
  moduleArr.push(rootModule);
  const isDynamic = isDynamicModule(rootModule);
  const imports = isDynamic
    ? rootModule.imports
    : getModuleMetadata("imports", rootModule);

  const controllers = isDynamic
    ? rootModule.controllers
    : getModuleMetadata("controllers", rootModule);
  const providers: Provider[] = isDynamic
    ? rootModule.providers
    : getModuleMetadata("providers", rootModule);
  // const exports = isDynamicModule
  //   ? module.exports
  //   : getModuleMetadata("exports", module); // TODO don't think well how to use exports
  if (controllers) {
    controllerArr.push(...controllers);
  }
  if (providers) {
    if (isDynamic) {
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
      moduleArr,
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
    return onModuleInit(instance);
  }));
  return arr;
}

function onModuleInit(instance: any) {
  if (typeof instance.onModuleInit === "function") {
    if (Reflect.hasOwnMetadata(onModuleInitedKey, instance)) {
      return;
    }
    Reflect.defineMetadata(onModuleInitedKey, true, instance);
    return instance.onModuleInit();
  }
}

export async function initController(Cls: Type, cache?: Map<any, any>) {
  const instance = await Factory(Cls, undefined, cache);
  await onModuleInit(instance);
  return instance;
}

export async function initModule(
  module: ModuleType,
  cache?: Map<any, any>,
) {
  const isDynamic = isDynamicModule(module);
  if (isDynamic) {
    await onModuleInit(module);
    return module;
  } else {
    const instance = await Factory(module, undefined, cache);
    await onModuleInit(instance);
    return instance;
  }
}

export class NestFactory {
  static async create(
    rootModule: ModuleType,
    Router: IRouterConstructor,
    options?: FactoryCreateOptions,
  ) {
    const router = new Router({ strict: options?.strict });
    const app = new Application(router);
    const cache = options?.cache ?? globalFactoryCaches;
    const modules: ModuleType[] = [];
    const controllers: Type<any>[] = [];
    const registeredProviders: RegisteredProvider[] = [];
    const dynamicProviders: Provider[] = [];
    const specialProviders: SpecialProvider[] = [];
    await findControllers(
      rootModule,
      modules,
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

    // init modules
    await Promise.all(modules.map((module) => {
      return initModule(module, cache);
    }));

    return app;
  }
}
