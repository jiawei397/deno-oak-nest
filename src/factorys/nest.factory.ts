// deno-lint-ignore-file no-explicit-any
import { createHttpError } from "https://deno.land/x/oak@v10.2.0/httpError.ts";
import {
  Application,
  blue,
  Context,
  extname,
  gzip,
  Reflect,
  resolve,
  send,
  Status,
  yellow,
} from "../../deps.ts";
import { getModuleMetadata, isModule } from "../decorators/module.ts";
import {
  GzipOptions,
  ModuleType,
  Next,
  Provider,
  Scope,
  StaticOptions,
  Type,
  ViewOptions,
} from "../interfaces/mod.ts";
import { join, Router } from "../router.ts";
import { initProvider } from "./class.factory.ts";

const onModuleInitedKey = Symbol("onModuleInited");

export type ApplicationEx = Application & {
  setGlobalPrefix: typeof Router.prototype.setGlobalPrefix;
  routes: typeof Router.prototype.routes;
  get: typeof Router.prototype.get;
  use: typeof Router.prototype.use;
  useGlobalInterceptors: typeof Router.prototype.useGlobalInterceptors;
  disableGetComputeEtag: typeof Router.prototype.disableGetComputeEtag;
  useStaticAssets: typeof NestFactory.useStaticAssets;
  setView: typeof NestFactory.setView;
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
) {
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
      if (Reflect.hasOwnMetadata(onModuleInitedKey, provider)) {
        return;
      }
      Reflect.defineMetadata(onModuleInitedKey, true, provider);
      return instance.onModuleInit();
    }
  }));
}

const defaultGzipOptions: GzipOptions = {
  extensions: [".js", ".css", ".wasm"],
  threshold: 1024 * 10, // 10kb
  level: 5,
};

export class NestFactory {
  private static viewOptions?: ViewOptions;
  private static staticOptions?: StaticOptions;

  static async create(module: ModuleType) {
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
    await initProviders(specialProviders);
    await initProviders(dynamicProviders); // init dynamic providers first to avoid it be inited first by other providers
    await initProviders(registeredProviders);

    if (controllers.length) {
      await router.add(...controllers);
    }

    // bind router methods to app
    app.setGlobalPrefix = router.setGlobalPrefix.bind(router);
    app.get = router.get.bind(router);
    app.routes = router.routes.bind(router);
    app.useGlobalInterceptors = router.useGlobalInterceptors.bind(router);
    app.useStaticAssets = this.useStaticAssets.bind(this);
    app.setView = this.setView.bind(this);
    app.disableGetComputeEtag = router.disableGetComputeEtag.bind(router);
    app.router = router;

    this.startView(app);

    return app;
  }

  static setView(viewOptions: ViewOptions) {
    this.viewOptions = viewOptions;
  }

  private static checkWithPrefix(prefix: string, pathname: string) {
    const prefixWithoutSlash = join(prefix);
    if (
      prefixWithoutSlash !== "" &&
      (pathname === prefixWithoutSlash ||
        pathname.startsWith(prefixWithoutSlash + "/"))
    ) {
      return true;
    }
    return false;
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

  private static async serveStaticAssets(context: Context, next: Next) {
    if (!this.staticOptions) {
      return next();
    }
    const options = this.staticOptions;
    const {
      baseDir,
      prefix = "/",
      gzip: _gzip,
      useOriginGzip,
      ...otherOptions
    } = options;
    const prefixWithoutSlash = join(prefix);
    const root = resolve(Deno.cwd(), baseDir!);
    const index = options?.index || "index.html";
    if (!prefixWithoutSlash) {
      return send(context, "", {
        ...otherOptions,
        index,
        root,
      });
    }
    const pathname = context.request.url.pathname;
    const formattedPath = pathname.replace(prefixWithoutSlash, "");
    const sendFile = () =>
      send(context, formattedPath, {
        ...otherOptions,
        index,
        root,
        gzip: useOriginGzip || false,
      });
    if (useOriginGzip) {
      return sendFile();
    }
    let canGzip = !!_gzip;
    if (_gzip) {
      let extensions: string[] = defaultGzipOptions.extensions!;
      if (typeof _gzip !== "boolean") {
        if (Array.isArray(_gzip.extensions)) {
          extensions = _gzip.extensions;
        }
      }
      canGzip = extensions.includes(extname(pathname));
    }
    if (!canGzip) {
      return sendFile();
    }
    const gzipOptions = typeof _gzip === "boolean" ? defaultGzipOptions : {
      ...defaultGzipOptions,
      ..._gzip,
    };
    const realFilePath = resolve(
      Deno.cwd(),
      baseDir!,
      formattedPath,
    );
    const gzipPath = realFilePath + ".gz";
    const fileContent = await Deno.readFile(gzipPath).catch(() => {});
    if (fileContent) {
      context.response.body = fileContent;
    } else {
      let fileContent: Uint8Array;
      try {
        fileContent = await Deno.readFile(realFilePath);
      } catch (err) {
        if (err instanceof Deno.errors.NotFound) {
          throw createHttpError(404, err.message);
        }
      }
      if (gzipOptions.filter && !gzipOptions.filter(context, fileContent!)) {
        return sendFile();
      }
      if (fileContent!.length < gzipOptions.threshold!) {
        // console.debug(
        //   "File is too small to gzip",
        //   realFilePath,
        //   fileContent.length,
        //   gzipOptions.threshold,
        // );
        return sendFile();
      }
      const gzipContent = gzip(fileContent!, gzipOptions.level);
      context.response.body = gzipContent;
      const status = await Deno.permissions.query({ name: "write" });
      if (status.state === "granted") {
        await Deno.writeFile(gzipPath, gzipContent).catch(console.error);
        console.info(`${blue("write gzip file success")} [${gzipPath}]`);
      } else {
        console.warn(`${yellow("write gzip file denied")} [${gzipPath}]`);
      }
    }
    context.response.headers.set("Content-Encoding", "gzip");
    context.response.headers.delete("Content-Length");
  }

  /**
   * start serve view and static assets.
   *
   * If has prefix either api or view of static assets, it will be served self without other check, so it`s a good idea to set prefix if you want to have a good performance.
   *
   * Then it will check the extension of the pathname, if it`s optioned such as `ejs`, it will be served view, otherwise it will be served static assets.
   *
   * But if there is index.html in the static assets, it will be served first before the view.
   * @param app
   */
  private static startView(app: ApplicationEx) {
    app.use(async (context, next) => {
      const viewOptions = this.viewOptions;
      if (
        (!viewOptions && !this.staticOptions) ||
        context.request.method !== "GET"
      ) {
        return next();
      }
      const pathname = context.request.url.pathname;
      if (this.checkWithPrefix(app.router.apiPrefix, pathname)) { // api
        return next();
      }
      if (
        this.staticOptions?.prefix &&
        this.checkWithPrefix(this.staticOptions.prefix, pathname) // static
      ) {
        return this.serveStaticAssets(context, next);
      }
      if (
        viewOptions &&
        (pathname.endsWith(viewOptions.extension) ||
          (viewOptions.prefix &&
            this.checkWithPrefix(viewOptions.prefix, pathname)))
      ) {
        return this.serveViews(context, next);
      }

      // first if static, then if view, then api
      try {
        await this.serveStaticAssets(context, next);
      } catch (e) {
        if (e.status === Status.NotFound) {
          try {
            return await this.serveViews(context, next);
          } catch {
            return next(); // api
          }
        } else {
          throw e;
        }
      }
    });
  }

  private static async serveViews(context: Context, next: Next) {
    const viewOptions = this.viewOptions;
    if (!viewOptions) {
      return next();
    }
    const pathname = context.request.url.pathname;
    let name = pathname.substring(1);
    if (viewOptions.prefix) {
      name = pathname.replace(join(viewOptions.prefix), "");
    }
    const filename = (name || "index") + "." + viewOptions.extension;
    const path = resolve(
      viewOptions.baseDir,
      filename,
    );
    context.response.body = await viewOptions.renderFile(path, context);
  }
}
