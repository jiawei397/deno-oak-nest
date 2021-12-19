// deno-lint-ignore-file no-explicit-any
import { Application, Reflect } from "../../deps.ts";
import { getModuleMetadata, isModule } from "../decorators/module.ts";
import { ModuleType, Provider, Scope, Type } from "../interfaces/mod.ts";
import { Router } from "../router.ts";
import { initProvider } from "./class.factory.ts";

export type ApplicationEx = Application & {
  setGlobalPrefix: typeof Router.prototype.setGlobalPrefix;
  routes: typeof Router.prototype.routes;
  get: typeof Router.prototype.get;
  use: typeof Router.prototype.use;
  useGlobalInterceptors: typeof Router.prototype.useGlobalInterceptors;
};

export class NestFactory {
  static async #findControllers(
    module: ModuleType,
    controllerArr: Type<any>[],
    providerArr: Provider[],
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
    const providers = isDynamicModule
      ? module.providers
      : getModuleMetadata("providers", module);
    // const exports = isDynamicModule
    //   ? module.exports
    //   : getModuleMetadata("exports", module); // TODO donnot think how to use exports
    if (controllers) {
      controllerArr.push(...controllers);
    }
    if (providers) {
      providerArr.push(...providers);
    }
    if (imports && imports.length > 0) {
      await Promise.all(imports.map(async (item: any) => {
        if (!item) {
          return;
        }
        const module = await item;
        return this.#findControllers(module, controllerArr, providerArr);
      }));
    }
  }

  static async #initProviders(providers: Provider[]) {
    const onModuleInitedKey = Symbol("onModuleInited");
    const arr = [];
    for (const provider of providers) {
      const instance = await initProvider(provider, Scope.DEFAULT);
      if (instance) {
        arr.push({
          instance,
          provider,
        });
      }
    }
    return Promise.all(arr.map(({ instance, provider }) => {
      if (typeof instance.onModuleInit === "function") {
        if (Reflect.hasMetadata(onModuleInitedKey, provider)) {
          return;
        }
        Reflect.defineMetadata(onModuleInitedKey, true, provider);
        return instance.onModuleInit();
      }
    }));
  }

  static async create(module: ModuleType) {
    const app = new Application() as ApplicationEx;
    const router = new Router();
    const controllers: Type<any>[] = [];
    const providers: Provider<any>[] = [];
    await this.#findControllers(module, controllers, providers);
    await this.#initProviders(providers);

    if (controllers.length) {
      await router.add(...controllers);
    }
    app.setGlobalPrefix = router.setGlobalPrefix.bind(router);
    app.get = router.get.bind(router);
    app.routes = router.routes.bind(router);
    app.useGlobalInterceptors = router.useGlobalInterceptors.bind(router);
    return app;
  }
}
