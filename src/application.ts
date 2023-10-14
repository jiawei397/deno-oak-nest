// deno-lint-ignore-file no-explicit-any
import { blue, format, green, red, Reflect, Status, yellow } from "../deps.ts";
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from "./constants.ts";
import {
  META_ALIAS_KEY,
  META_HEADER_KEY,
  META_HTTP_CODE_KEY,
  META_METHOD_KEY,
  META_PATH_KEY,
} from "./decorators/controller.ts";
import {
  getModuleMetadata,
  isDynamicModule,
  isModule,
  onModuleInit,
} from "./decorators/module.ts";
import {
  ForbiddenException,
  HttpException,
  InternalServerErrorException,
} from "./exceptions.ts";
import {
  Factory,
  globalFactoryCaches,
  initProvider,
} from "./factorys/class.factory.ts";
import { checkByFilters } from "./filter.ts";
import { checkByGuard } from "./guard.ts";
import { checkByInterceptors } from "./interceptor.ts";
import {
  ApiPrefixOptions,
  ListenOptions,
  ShutdownSignal,
} from "./interfaces/application.interface.ts";
import { Context } from "./interfaces/context.interface.ts";
import { AliasOptions } from "./interfaces/controller.interface.ts";
import { StaticOptions } from "./interfaces/factory.interface.ts";
import { ExceptionFilters } from "./interfaces/filter.interface.ts";
import { ControllerMethod, NestGuards } from "./interfaces/guard.interface.ts";
import { NestUseInterceptors } from "./interfaces/interceptor.interface.ts";
import { LoggerService } from "./interfaces/log.interface.ts";
import { NestMiddleware } from "./interfaces/middleware.interface.ts";
import { ModuleType } from "./interfaces/module.interface.ts";
import {
  Provider,
  RegisteredProvider,
  SpecialProvider,
} from "./interfaces/provider.interface.ts";
import { IRouter, RouteItem, RouteMap } from "./interfaces/route.interface.ts";
import { Scope } from "./interfaces/scope-options.interface.ts";
import { Constructor, Type } from "./interfaces/type.interface.ts";
import { transferParam } from "./params.ts";

export function join(...paths: string[]) {
  if (paths.length === 0) {
    return "";
  }
  const str = paths.join("/").replaceAll("///", "/").replaceAll("//", "/");
  let last = str;
  if (!last.startsWith("/")) {
    last = "/" + last;
  }
  if (last.endsWith("/")) {
    last = last.substring(0, last.length - 1);
  }
  return last;
}

export function replacePrefix(str: string, prefix: string) {
  return join(str.replace(/\$\{prefix\}/, prefix));
}

export function replaceSuffix(str: string, suffix: string) {
  return join(str.replace(/\$\{suffix\}/, suffix));
}

export function replaceController(str: string, suffix: string) {
  return join(str.replace(/\$\{controller\}/, suffix));
}

export function replacePrefixAndSuffix(
  str: string,
  prefix: string,
  suffix: string,
  controller?: string,
) {
  let temp = replacePrefix(str, prefix);
  if (controller) {
    temp = replaceController(temp, controller);
  }
  temp = replaceSuffix(temp, suffix);
  return temp;
}

export async function mapRoute(
  Cls: Type,
  cache?: Map<any, any>,
): Promise<RouteMap[]> {
  const instance = await Factory(Cls, undefined, cache);
  const prototype = Cls.prototype;
  const result: RouteMap[] = [];
  Object.getOwnPropertyNames(prototype)
    .forEach((item) => {
      if (item === "constructor") {
        return;
      }
      if (typeof prototype[item] !== "function") {
        return;
      }
      const fn = prototype[item];
      const methodPath = Reflect.getMetadata(META_PATH_KEY, fn);
      if (!methodPath) {
        return;
      }
      const methodType = Reflect.getMetadata(META_METHOD_KEY, fn);
      const aliasOptions: AliasOptions = Reflect.getMetadata(
        META_ALIAS_KEY,
        fn,
      );
      result.push({
        methodPath,
        aliasOptions,
        methodType: methodType.toLowerCase(),
        fn,
        instance,
        cls: Cls,
        methodName: item,
      });
    });
  return result;
}

export async function collect(
  rootModule: ModuleType,
  moduleArr: ModuleType[],
  controllerArr: Type<any>[],
  registeredProviders: RegisteredProvider[],
  dynamicProviders: Provider[],
  specialProviders: SpecialProvider[],
) {
  if (!isModule(rootModule)) {
    return;
  }
  moduleArr.push(rootModule);
  const isDynamic = isDynamicModule(rootModule);
  const imports = isDynamic
    ? rootModule.imports
    : getModuleMetadata("imports", rootModule);

  const controllers = isDynamic
    ? rootModule.controllers
    : getModuleMetadata("controllers", rootModule);
  const providers: Provider[] = isDynamic
    ? rootModule.providers
    : getModuleMetadata("providers", rootModule);
  // const exports = isDynamicModule
  //   ? module.exports
  //   : getModuleMetadata("exports", module); // TODO don't think well how to use exports
  if (controllers) {
    controllerArr.push(...controllers);
  }
  if (providers) {
    if (isDynamic) {
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
    return collect(
      module,
      moduleArr,
      controllerArr,
      registeredProviders,
      dynamicProviders,
      specialProviders,
    );
  }));
}

export async function getRouterArr(
  controllers: Type<any>[],
  cache: Map<any, any>,
) {
  const routerArr: RouteItem[] = [];
  await Promise.all(controllers.map(async (Cls) => {
    const arr = await mapRoute(Cls, cache);
    const path = Reflect.getMetadata(META_PATH_KEY, Cls);
    const aliasOptions = Reflect.getMetadata(META_ALIAS_KEY, Cls);
    const controllerPath = join(path);
    routerArr.push({
      controllerPath,
      arr,
      cls: Cls,
      aliasOptions,
    });
  }));
  return routerArr;
}

export class Application {
  private apiPrefix = "";
  private apiPrefixOptions: ApiPrefixOptions = {};
  private staticOptions: StaticOptions;
  
  private globalInterceptors: NestUseInterceptors = [];
  private globalExceptionFilters: ExceptionFilters = [];
  private globalGuards: NestGuards = [];
  private cache: Map<any, any> = globalFactoryCaches;

  private abortController: AbortController = new AbortController();
  private instances = new Set<any>();
  private controllers: Type<any>[] = [];

  private logger: LoggerService = console;
  private startTime = Date.now();

  constructor(protected router: IRouter) {}

  setGlobalPrefix(apiPrefix: string, options: ApiPrefixOptions = {}) {
    this.apiPrefix = apiPrefix;
    this.apiPrefixOptions = options;
  }

  get(path: string, middleware: NestMiddleware) {
    this.router.get(path, async (ctx, next) => {
      await middleware(ctx.request, ctx.response, next);
    });
  }

  use(...middlewares: NestMiddleware[]): void {
    middlewares.forEach((middleware) => {
      this.router.use(async (ctx, next) => {
        await middleware(ctx.request, ctx.response, next);
      });
    });
  }

  async listen(options?: ListenOptions): Promise<void> {
    await this.routes();
    this.router.routes();
    this.router.serveForStatic(this.staticOptions);
    await this.onApplicationBootstrap();
    this.router.startServer({
      signal: this.abortController.signal,
      ...options,
    });
    this.log(
      yellow("[NestApplication]"),
      green(
        `Nest application successfully started ${
          Date.now() - this.startTime
        }ms`,
      ),
    );
  }

  /**
   * Close the application.
   * @param [signal] The signal which caused the shutdown.
   */
  async close(signal?: ShutdownSignal) {
    await this.onModuleDestroy().catch((err) => {
      this.logger.error(err); // TODO: log format
    });
    await this.beforeApplicationShutdown(signal);
    this.abortController.abort();
    await this.onApplicationShutdown(signal);
  }

  /**
   * Enables the usage of shutdown hooks. Will call the
   * `onApplicationShutdown` function of a provider if the
   * process receives a shutdown signal.
   *
   * @param {ShutdownSignal[]} [signals=[]] The system signals it should listen to
   *
   * @returns {this} The Nest application context instance
   */
  public enableShutdownHooks(signals: ShutdownSignal[] = []): this {
    let currentSignal: ShutdownSignal | "" = "";
    new Set(signals).forEach((signal) => {
      const callback = () => {
        if (currentSignal) {
          return;
        }
        currentSignal = signal;
        Deno.removeSignalListener(signal, callback);
        this.close(signal);
      };
      Deno.addSignalListener(signal, callback);
    });
    return this;
  }

  useGlobalInterceptors(...interceptors: NestUseInterceptors) {
    this.globalInterceptors.push(...interceptors);
  }

  useGlobalFilters(...filters: ExceptionFilters) {
    this.globalExceptionFilters.push(...filters);
  }

  useGlobalGuards(...guards: NestGuards) {
    this.globalGuards.push(...guards);
  }

  /**
   * Sets custom logger service.
   * Flushes buffered logs if auto flush is on.
   * @returns {void}
   */
  useLogger(logger: LoggerService): void {
    this.logger = logger;
  }

  /**
   * Sets a base directory for public assets.
   * @example
   * app.useStaticAssets('public')
   */
  useStaticAssets(
    path: string,
    options: StaticOptions = {},
  ) {
    this.staticOptions = {
      baseDir: path,
      ...options,
    };
  }

  /**
   * add controller
   * @protected not recommend to alone use
   */
  addController(...clsArr: Type[]) {
    this.controllers.push(...clsArr);
  }

  private log(...message: string[]) {
    this.logger.info(
      yellow("[Nest]"),
      green(format(new Date(), "yyyy-MM-dd HH:mm:ss")),
      ...message,
    );
  }

  private async formatResponse(
    context: Context,
    options: {
      target: InstanceType<Constructor>;
      args: any[];
      methodName: string;
      methodType: string; // get/post/put/delete
      fn: ControllerMethod;
    },
  ) {
    // format response body
    if (context.response.status === 304) {
      context.response.body = null;
    } else if (context.response.body !== undefined) {
      const body = context.response.body;
      if (body instanceof Promise) {
        context.response.body = await body;
      }
    }

    // response headers
    const headers: Record<string, string> = Reflect.getMetadata(
      META_HEADER_KEY,
      options.fn,
    );
    if (headers) {
      Object.keys(headers).forEach((key) => {
        context.response.headers.set(key, headers[key]);
      });
    }

    // response http code
    const code: number = Reflect.getMetadata(
      META_HTTP_CODE_KEY,
      options.fn,
    );
    if (code) {
      context.response.status = code;
    }
  }

  private async validateGuard(
    target: InstanceType<Constructor>,
    fn: ControllerMethod,
    context: Context,
  ): Promise<boolean> {
    try {
      const originStatus = context.response.status;
      const passed = await checkByGuard(
        target,
        fn,
        context,
        this.globalGuards,
      );
      if (!passed) {
        if (context.response.status === originStatus) {
          context.response.status = Status.Forbidden;
        }
        if (!context.response.body) {
          context.response.body = new ForbiddenException("").response;
        }
        return false;
      }
      return true;
    } catch (error) {
      this.catchError(context, error);
      return false;
    }
  }

  private async catchFilter(
    target: InstanceType<Constructor>,
    fn: ControllerMethod,
    context: Context,
    error: any,
  ) {
    await checkByFilters(
      context,
      target,
      this.globalExceptionFilters,
      fn,
      error,
    ).catch((err) => this.catchError(context, err));
  }

  private catchError(context: Context, error: any) {
    const err = error instanceof HttpException
      ? error
      : new InternalServerErrorException(error.message || error);
    context.response.status = err.status;
    context.response.body = err.response;
  }

  protected async routes() {
    const routeStart = Date.now();
    const apiPrefixReg = this.apiPrefixOptions?.exclude;

    const routerArr = await getRouterArr(this.controllers, this.cache);
    routerArr.forEach(
      ({ controllerPath, arr, aliasOptions: controllerAliasOptions }) => {
        let isAbsolute = controllerAliasOptions?.isAbsolute;
        if (!isAbsolute && apiPrefixReg) {
          isAbsolute = apiPrefixReg.some((str) => {
            const reg = typeof str === "string" ? new RegExp(str) : str;
            return reg.test(controllerPath);
          });
        }
        let controllerPathWithPrefix = isAbsolute
          ? controllerPath
          : join(this.apiPrefix, controllerPath);
        controllerPathWithPrefix = replacePrefixAndSuffix(
          controllerPathWithPrefix,
          this.apiPrefix,
          controllerPath,
        );
        const controllerAliasPath = controllerAliasOptions?.alias &&
          replacePrefixAndSuffix(
            controllerAliasOptions.alias,
            this.apiPrefix,
            controllerPath,
          );
        const startTime = Date.now();
        let lastCls;
        arr.forEach((routeMap: RouteMap) => {
          const {
            methodPath,
            aliasOptions,
            methodType,
            fn,
            methodName,
            instance,
            cls,
          } = routeMap;
          lastCls = cls;
          const isAbsolute = aliasOptions?.isAbsolute;
          const alias = aliasOptions?.alias;
          const originPath = isAbsolute
            ? replacePrefix(methodPath, this.apiPrefix)
            : join(controllerPathWithPrefix, methodPath);
          let aliasPath = alias ??
            (controllerAliasPath && !isAbsolute &&
              join(controllerAliasPath, methodPath));
          const funcStart = Date.now();
          const callback = async (context: Context) => {
            // validate guard
            if (await this.validateGuard(instance, fn, context) === false) {
              return;
            }

            // transfer params
            let args: any[];
            try {
              args = await transferParam(instance, methodName, context);
            } catch (error) {
              await this.catchFilter(instance, fn, context, error);
              return;
            }

            // call controller method
            try {
              const next = async () => {
                const result = await fn.apply(instance, args);
                if (
                  result !== undefined && context.response.body === undefined
                ) {
                  context.response.body = result;
                }
                return result;
              };
              await checkByInterceptors(
                context,
                this.globalInterceptors,
                fn,
                {
                  target: instance,
                  methodName,
                  methodType,
                  args,
                  fn,
                  next,
                },
              );
            } catch (error) {
              await this.catchFilter(instance, fn, context, error);
            }

            await this.formatResponse(
              context,
              {
                fn,
                target: instance,
                methodType,
                args,
                methodName,
              },
            );
            // console.log(context.res.body, result);
          };
          this.router[methodType](originPath, callback);

          if (aliasPath) {
            aliasPath = replacePrefixAndSuffix(
              aliasPath,
              this.apiPrefix,
              methodPath,
              controllerPath,
            );
            this.router[methodType](aliasPath, callback);
          }
          const funcEnd = Date.now();
          this.log(
            yellow("[RouterExplorer]"),
            green(
              `Mapped {${
                aliasPath
                  ? (originPath + ", " + red(aliasPath))
                  : (isAbsolute ? red(originPath) : originPath)
              }, ${methodType.toUpperCase()}} route ${
                funcEnd -
                funcStart
              }ms`,
            ),
          );
        });

        const endTime = Date.now();
        const name = lastCls?.["name"];
        this.log(
          red("[RoutesResolver]"),
          blue(
            `${name} {${controllerPathWithPrefix}} ${endTime - startTime}ms`,
          ),
        );
      },
    );
  }

  private async initModule(module: ModuleType) {
    const isDynamic = isDynamicModule(module);
    if (isDynamic) {
      await onModuleInit(module);
      return module;
    } else {
      const instance = await Factory(module, undefined, this.cache);
      await onModuleInit(instance);
      return instance;
    }
  }

  private async initController(Cls: Type) {
    const instance = await Factory(Cls, undefined, this.cache);
    await onModuleInit(instance);
    return instance;
  }

  private async initProviders(providers: Provider[]) {
    const arr = [];
    for (const provider of providers) {
      const instance = await initProvider(provider, Scope.DEFAULT, this.cache);
      this.instances.add(instance);
      if (instance) {
        arr.push({
          instance,
          provider,
        });
      }
    }
    await Promise.all(arr.map(({ instance, provider }) => {
      // register global interceptor, filter, guard
      if ("provide" in provider) {
        const provide = provider.provide;
        if (provide === APP_INTERCEPTOR) {
          this.useGlobalInterceptors(instance);
        } else if (provide === APP_FILTER) {
          this.useGlobalFilters(instance);
        } else if (provide === APP_GUARD) {
          this.useGlobalGuards(instance);
        }
      }
      return onModuleInit(instance);
    }));
    return arr;
  }

  async init(appModule: ModuleType, cache: Map<any, any>) {
    this.cache = cache;

    this.log(
      yellow("[NestFactory]"),
      green(`Starting Nest application...`),
    );
    const start = Date.now();
    const modules: ModuleType[] = [];
    const controllers: Type<any>[] = this.controllers;
    const registeredProviders: RegisteredProvider[] = [];
    const dynamicProviders: Provider[] = [];
    const specialProviders: SpecialProvider[] = [];
    await collect(
      appModule,
      modules,
      controllers,
      registeredProviders,
      dynamicProviders,
      specialProviders,
    );
    this.log(
      yellow("[NestApplication]"),
      green(
        `AppModule dependencies collected ${Date.now() - start}ms`,
      ),
    );

    const startInit = Date.now();
    await this.initProviders(specialProviders);
    await this.initProviders(dynamicProviders); // init dynamic providers first to avoid it be inited first by other providers
    await this.initProviders(registeredProviders);

    if (controllers.length) {
      await Promise.all(controllers.map(async (controller) => {
        const instance = await this.initController(controller);
        this.instances.add(instance);
      }));
    }

    // init modules
    await Promise.all(modules.map(async (module) => {
      const instance = await this.initModule(module);
      this.instances.add(instance);
    }));

    this.log(
      yellow("[NestApplication]"),
      green(
        `AppModule dependencies initialized ${Date.now() - startInit}ms`,
      ),
    );
  }

  /**
   * TODO: think about whether to use Promise.all or a for loop
   */
  private async onApplicationBootstrap(): Promise<void> {
    await Promise.all([...this.instances].map((instance) => {
      if (typeof instance.onApplicationBootstrap === "function") {
        return instance.onApplicationBootstrap();
      }
    }));
  }

  /**
   * TODO: think about whether to use Promise.all or a for loop
   */
  private async onApplicationShutdown(signal?: string): Promise<void> {
    await Promise.all([...this.instances].map((instance) => {
      if (typeof instance.onApplicationShutdown === "function") {
        return instance.onApplicationShutdown(signal);
      }
    }));
  }

  private async beforeApplicationShutdown(signal?: string): Promise<void> {
    await Promise.all([...this.instances].map((instance) => {
      if (typeof instance.beforeApplicationShutdown === "function") {
        return instance.beforeApplicationShutdown(signal);
      }
    }));
  }

  private async onModuleDestroy(): Promise<void> {
    await Promise.all([...this.instances].map((instance) => {
      if (typeof instance.onModuleDestroy === "function") {
        return instance.onModuleDestroy();
      }
    }));
  }
}
