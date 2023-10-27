import { Application } from "../application.ts";
import type {
  FactoryCreateOptions,
  IRouterConstructor,
  ModuleType,
} from "../interfaces/mod.ts";

export class NestFactory {
  static async create(
    rootModule: ModuleType,
    Router: IRouterConstructor,
    options?: FactoryCreateOptions,
  ) {
    const router = new Router({ strict: options?.strict });
    const app = new Application(router);
    await app.init(rootModule, options?.cache);

    return app;
  }
}
