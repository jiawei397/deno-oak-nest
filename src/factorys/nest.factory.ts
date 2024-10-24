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
  ): Promise<Application> {
    const router = new Router(options);
    const app = new Application(router);
    if (options?.logger !== undefined) {
      app.useLogger(options.logger);
    } else if (Deno.env.get("DENO_ENV") === "test") {
      app.useLogger(false);
    }
    await app.init(rootModule, options?.cache);

    return app;
  }
}
