// deno-lint-ignore-file no-explicit-any
import { Application, Reflect, serveStatic } from "../../deps.ts";
import { getModuleMetadata, isModule } from "../decorators/module.ts";
import type {
  ModuleType,
  Provider,
  StaticOptions,
  Type,
} from "../interfaces/mod.ts";
import { Scope } from "../interfaces/mod.ts";
import { Router } from "../router.ts";
import { globalFactoryCaches, initProvider } from "./class.factory.ts";

const onModuleInitedKey = Symbol("onModuleInited");

export type ApplicationEx = Application & {
  setGlobalPrefix: typeof Router.prototype.setGlobalPrefix;
  routes2: () => void;
  // get: typeof Router.prototype.get;
  useGlobalInterceptors: typeof Router.prototype.useGlobalInterceptors;
  useStaticAssets: typeof NestFactory.useStaticAssets;
  router: Router;
};

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
  //   : getModuleMetadata("exports", module); // TODO donnot think well how to use exports
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
  private static staticOptions?: StaticOptions;

  static app: ApplicationEx;

  static async create(module: ModuleType, cache = globalFactoryCaches) {
    const app = new Application() as ApplicationEx;
    const router = new Router();
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
      router.defaultCache = cache;
      await router.register(...controllers);
    }

    // bind router methods to app
    app.setGlobalPrefix = router.setGlobalPrefix.bind(router);
    // app.get = router.get.bind(router);
    app.routes2 = () => {
      router.routes(app);
      this.startView(app);
    };
    app.useGlobalInterceptors = router.useGlobalInterceptors.bind(router);
    app.useStaticAssets = this.useStaticAssets.bind(this);

    this.app = app;

    return app;
  }

  /**
   * Sets a base directory for public assets.
   * @example
   * app.useStaticAssets('public')
   */
  static useStaticAssets(
    path: string,
    options: StaticOptions = {},
  ) {
    this.staticOptions = {
      baseDir: path,
      ...options,
    };
  }

  /**
   * start serve view and static assets.
   *
   * If has prefix either api or view of static assets, it will be served self without other check, so it`s a good idea to set prefix if you want to have a good performance.
   *
   * Then it will check the extension of the pathname, if it`s optioned such as `ejs`, it will be served view, otherwise it will be served static assets.
   *
   * But if there is index.html in the static assets, it will be served first before the view.
   */
  private static startView(app: Application) {
    if (!this.staticOptions) {
      return;
    }
    const path = this.staticOptions.path ? `${this.staticOptions.path}/*` : "*";
    app.use(
      path,
      serveStatic({
        root: this.staticOptions.baseDir,
        rewriteRequestPath: (path) =>
          this.staticOptions!.prefix
            ? path.replace(this.staticOptions!.prefix, "")
            : path,
      }),
    );
  }
}
