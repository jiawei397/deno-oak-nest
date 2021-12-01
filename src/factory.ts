// deno-lint-ignore-file no-explicit-any
import { Application, Reflect } from "../deps.ts";
import { Type } from "./interface.ts";
import { Router } from "./router.ts";

export type ApplicationEx = Application & {
  setGlobalPrefix: typeof Router.prototype.setGlobalPrefix;
  routes: typeof Router.prototype.routes;
  get: typeof Router.prototype.get;
  use: typeof Router.prototype.use;
};

export class NestFactory {
  static #findControllers(module: Type<any>, arr: Type<any>[] = []) {
    const imports = Reflect.getMetadata("imports", module);
    const controllers = Reflect.getMetadata("controllers", module) || [];
    imports.forEach((item: any) => {
      if (!item) {
        return;
      }
      const isModule = Reflect.getMetadata("isModule", item);
      if (!isModule) {
        return;
      }
      this.#findControllers(item, arr);
    });
    arr.push(...controllers);
    return arr;
  }
  static async create(module: Type<any>) {
    const app = new Application() as ApplicationEx;
    const router = new Router();
    // console.log(Reflect.getMetadata("controllers", module));
    // console.log(Reflect.getMetadata("imports", module));
    // console.log(Reflect.getMetadata("isModule", module));
    const controllers = this.#findControllers(module);
    // console.log("---controllers---", controllers);
    await router.add(...controllers);
    app.setGlobalPrefix = router.setGlobalPrefix.bind(router);
    app.get = router.get.bind(router);
    app.routes = router.routes.bind(router);
    return app;
  }
}
