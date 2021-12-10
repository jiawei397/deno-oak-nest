// deno-lint-ignore-file no-explicit-any
import { Application } from "../../deps.ts";
import { getModuleMetadata, isModule } from "../decorators/module.ts";
import { ModuleMetadata, Provider, Type } from "../interfaces/mod.ts";
import { Router } from "../router.ts";
import { initProvider } from "./class.factory.ts";

export type ApplicationEx = Application & {
  setGlobalPrefix: typeof Router.prototype.setGlobalPrefix;
  routes: typeof Router.prototype.routes;
  get: typeof Router.prototype.get;
  use: typeof Router.prototype.use;
};

export class NestFactory {
  static #findControllers(
    module: Type<any>,
    controllerArr: Type<any>[] = [],
    providerArr: Provider[] = [],
  ) {
    const imports = getModuleMetadata("imports", module);
    const controllers = getModuleMetadata("controllers", module) || [];
    const providers = getModuleMetadata("providers", module) || [];
    controllerArr.push(...controllers);
    providerArr.push(...providers);
    imports.forEach((item: any) => {
      if (!item) {
        return;
      }
      if (isModule(item)) {
        this.#findControllers(item, controllerArr, providerArr);
      } else {
        const itemModule = item as ModuleMetadata;
        if (itemModule.providers?.length) {
          providerArr.push(...itemModule.providers);
        }
        if (itemModule.controllers?.length) {
          controllerArr.push(...itemModule.controllers);
        }
      }
    });
  }

  static async create(module: Type<any>) {
    const app = new Application() as ApplicationEx;
    const router = new Router();
    const controllers: Type<any>[] = [];
    const providers: Provider[] = [];
    this.#findControllers(module, controllers, providers);
    if (providers.length) {
      await Promise.all(providers.map(initProvider));
    }
    if (controllers.length) {
      await router.add(...controllers);
    }
    app.setGlobalPrefix = router.setGlobalPrefix.bind(router);
    app.get = router.get.bind(router);
    app.routes = router.routes.bind(router);
    return app;
  }
}
