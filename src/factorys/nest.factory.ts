// deno-lint-ignore-file no-explicit-any
import {
  Application,
  blue,
  extname,
  gzip,
  Reflect,
  resolve,
  send,
  yellow,
} from "../../deps.ts";
import { getModuleMetadata, isModule } from "../decorators/module.ts";
import {
  GzipOptions,
  ModuleType,
  Provider,
  Scope,
  ServeStaticOptions,
  Type,
} from "../interfaces/mod.ts";
import { Router } from "../router.ts";
import { initProvider } from "./class.factory.ts";

const onModuleInitedKey = Symbol("onModuleInited");

export type ApplicationEx = Application & {
  setGlobalPrefix: typeof Router.prototype.setGlobalPrefix;
  routes: typeof Router.prototype.routes;
  get: typeof Router.prototype.get;
  use: typeof Router.prototype.use;
  useGlobalInterceptors: typeof Router.prototype.useGlobalInterceptors;
  router: Router;
  useStaticAssets: typeof useStaticAssets;
};

export async function findControllers(
  module: ModuleType,
  controllerArr: Type<any>[],
  registeredProviderArr: Provider[],
  dynamicProviders: Provider[],
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
  //   : getModuleMetadata("exports", module); // TODO donnot think well how to use exports
  if (controllers) {
    controllerArr.push(...controllers);
  }
  if (providers) {
    if (isDynamicModule) {
      dynamicProviders.push(...providers);
    } else {
      registeredProviderArr.push(...providers);
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
      registeredProviderArr,
      dynamicProviders,
    );
  }));
}

export async function initProviders(providers: Provider[]) {
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

/**
 * Sets a base directory for public assets.
 * @example
 * app.useStaticAssets('public')
 */
export function useStaticAssets(
  this: Application,
  path: string,
  options: ServeStaticOptions = {},
) {
  const { prefix = "/", gzip: _gzip, ...otherOptions } = options;
  const pre = prefix.endsWith("/")
    ? prefix.substring(0, prefix.length - 1)
    : prefix;
  this.use(async (context, next) => {
    if (context.request.method !== "GET" && context.request.method !== "HEAD") {
      return next();
    }
    const pathname = context.request.url.pathname; // /static, /static/1.js
    if (pathname === pre) {
      return context.response.redirect(pathname + "/");
    }
    if (
      (pathname !== pre + "/") &&
      !(pathname.startsWith(pre + "/") && extname(pathname))
    ) {
      return next();
    }

    const formattedPath = pathname.substring(pre.length + 1);
    const sendFile = () =>
      send(context, formattedPath, {
        ...otherOptions,
        index: options?.index || "index.html",
        root: resolve(Deno.cwd(), path),
        gzip: false,
      });
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
    const gzipOptions = typeof _gzip === "boolean"
      ? defaultGzipOptions
      : Object.assign(_gzip!, defaultGzipOptions);
    const realFilePath = resolve(
      Deno.cwd(),
      path,
      formattedPath,
    );
    const gzipPath = realFilePath + ".gz";
    const fileContent = await Deno.readFile(gzipPath).catch(() => {});
    if (fileContent) {
      context.response.body = fileContent;
    } else {
      const fileContent = await Deno.readFile(realFilePath).catch(() => {});
      if (!fileContent) {
        context.response.status = 404;
        context.response.body = "not found";
        return;
      }
      if (gzipOptions.filter && !gzipOptions.filter(context, fileContent)) {
        return sendFile();
      }
      if (fileContent.length < gzipOptions.threshold!) {
        // console.debug("File is too small to gzip", realFilePath);
        return sendFile();
      }
      const gzipContent = gzip(fileContent, gzipOptions.level);
      context.response.body = gzipContent;
      const status = await Deno.permissions.query({ name: "write" });
      if (status.state === "granted") {
        Deno.writeFile(gzipPath, gzipContent).then(() => {
          console.info(`${blue("write gzip file success")} [${gzipPath}]`);
        }).catch(console.error);
      } else {
        console.warn(`${yellow("write gzip file denied")} [${gzipPath}]`);
      }
    }
    context.response.headers.set("Content-Encoding", "gzip");
    context.response.headers.delete("Content-Length");
  });
  return this;
}

export class NestFactory {
  static async create(module: ModuleType) {
    const app = new Application() as ApplicationEx;
    const router = new Router();
    const controllers: Type<any>[] = [];
    const registeredProviders: Provider<any>[] = [];
    const dynamicProviders: Provider<any>[] = [];
    await findControllers(
      module,
      controllers,
      registeredProviders,
      dynamicProviders,
    );
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
    app.router = router;
    app.useStaticAssets = useStaticAssets.bind(app);

    return app;
  }
}
