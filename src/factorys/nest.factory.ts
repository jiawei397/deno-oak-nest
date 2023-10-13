import { Application } from "../application.ts";
import type {
  FactoryCreateOptions,
  IRouterConstructor,
  ModuleType,
} from "../interfaces/mod.ts";
import { globalFactoryCaches } from "./class.factory.ts";

export class NestFactory {
  static async create(
    rootModule: ModuleType,
    Router: IRouterConstructor,
    options?: FactoryCreateOptions,
  ) {
    const router = new Router({ strict: options?.strict });
    const app = new Application(router);
    const cache = options?.cache ?? globalFactoryCaches;

    await app.init(rootModule, cache);

    return app;
  }
}
