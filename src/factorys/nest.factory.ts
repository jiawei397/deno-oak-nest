// deno-lint-ignore-file no-explicit-any
import { Application } from "../../deps.ts";
import { getModuleMetadata, isModule } from "../decorators/module.ts";
import { ModuleType, Provider, Scope, Type } from "../interfaces/mod.ts";
import { Router } from "../router.ts";
import { initProvider } from "./class.factory.ts";

export type ApplicationEx = Application & {
  setGlobalPrefix: typeof Router.prototype.setGlobalPrefix;
  routes: typeof Router.prototype.routes;
  get: typeof Router.prototype.get;
  use: typeof Router.prototype.use;
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
    const isDynamicModule = "imports" in module;
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

  static async #initProvidersInModule(providers: Provider[]) {
    for (const provider of providers) {
      await initProvider(provider, Scope.DEFAULT);
    }
  }

  static async create(module: ModuleType) {
    const app = new Application() as ApplicationEx;
    const router = new Router();
    const controllers: Type<any>[] = [];
    const providers: Provider<any>[] = [];
    await this.#findControllers(module, controllers, providers);
    await this.#initProvidersInModule(providers);

    if (controllers.length) {
      await router.add(...controllers);
    }
    app.setGlobalPrefix = router.setGlobalPrefix.bind(router);
    app.get = router.get.bind(router);
    app.routes = router.routes.bind(router);
    return app;
  }
}
