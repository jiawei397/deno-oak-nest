// deno-lint-ignore-file no-explicit-any
import { Reflect } from "../../deps.ts";
import { INQUIRER } from "../constants.ts";
import {
  META_ALIAS_KEY,
  META_METHOD_KEY,
  META_PATH_KEY,
} from "../decorators/controller.ts";
import { getInjectData, isSingleton } from "../decorators/inject.ts";
import { InternalServerErrorException } from "../exceptions.ts";
import type {
  AliasOptions,
  Constructor,
  ControllerMethod,
  ExceptionFilters,
  FactoryCaches,
  Instance,
  NestGuards,
  NestUseInterceptors,
  Provider,
  RouteItem,
  RouteMap,
} from "../interfaces/mod.ts";
import { Scope } from "../interfaces/mod.ts";
import {
  isClassProvider,
  isExistingProvider,
  isFactoryProvider,
  isSpecialProvider,
  isValueProvider,
} from "../module.ts";
import { join } from "../utils.ts";

export class ClassFactory {
  globalCaches: FactoryCaches = new Map();
  instanceCaches: Map<Instance, FactoryCaches> = new Map();

  getInstanceFromCaches<T>(
    target: any,
    cache?: FactoryCaches,
  ): T | undefined {
    if (cache?.has(target)) {
      return cache.get(target);
    }
    return this.globalCaches.get(target);
  }

  async getInstance<T>(
    target: Constructor<T>,
    options: {
      scope?: Scope;
      caches?: FactoryCaches;
      parentClass?: Constructor;
    } = {},
  ): Promise<T> {
    if (
      !target || (typeof target !== "object" && typeof target !== "function")
    ) {
      throw new Error(
        `Factory target must be a class or function, but got ${target}`,
      );
    }
    const paramtypes = Reflect.getMetadata("design:paramtypes", target);
    let args: any[] = [];
    if (paramtypes?.length) {
      args = await Promise.all(
        paramtypes.map(async (paramtype: Constructor, index: number) => {
          const injectedData = getInjectData(target, index);
          if (injectedData) {
            if (
              typeof injectedData === "string" ||
              typeof injectedData === "symbol"
            ) {
              if (INQUIRER === injectedData) { // inject parentClass
                return options.parentClass;
              }
              return this.getInstanceFromCaches(injectedData, options.caches);
            }
            if (typeof injectedData === "function") {
              return injectedData();
            }
            if (typeof injectedData.fn === "function") {
              return injectedData.fn.apply(
                injectedData.scope,
                injectedData.params,
              );
            }
          }
          const param = await this.create(paramtype, {
            ...options,
            parentClass: target,
          });
          return param;
        }),
      );
    }
    const instance = new target(...args);
    return instance;
  }

  // deno-lint-ignore require-await
  async create<T>(
    target: Constructor<T>,
    options: {
      scope?: Scope;
      caches?: FactoryCaches;
      parentClass?: Constructor;
    } = {},
  ): Promise<T> {
    const caches = options.caches || this.globalCaches;
    const scope = options.scope ?? Scope.DEFAULT;
    const singleton = isSingleton(target) && scope === Scope.DEFAULT;
    if (singleton) {
      const instance = this.getInstanceFromCaches<T>(target, caches);
      if (instance) {
        return instance;
      }
    }
    const instance = this.getInstance(target, options);
    if (singleton) {
      caches.set(target, instance);
    }
    return instance;
  }

  async initProvider(
    provider: Provider,
    options: {
      scope?: Scope;
      caches?: FactoryCaches;
    } = {},
  ) {
    if (provider instanceof Function) { // same with class provider
      return this.create(provider, options);
    }
    const caches = options.caches || this.globalCaches;

    if (isClassProvider(provider)) {
      return this.create(provider.useClass, {
        scope: provider.scope,
        caches,
      });
    }

    if (isExistingProvider(provider)) {
      const existingInstance = this.getInstanceFromCaches(
        provider.useExisting,
        options.caches,
      );
      if (!existingInstance) {
        throw new Error(
          `ExistingProvider: ${provider.useExisting} not found`,
        );
      }
      caches.set(provider.provide, existingInstance);
      return existingInstance;
    }

    if (isValueProvider(provider)) {
      caches.set(provider.provide, provider.useValue);
      return provider.useValue;
    }

    if (isFactoryProvider(provider)) {
      let result;
      if (provider.inject?.length) {
        const args = await Promise.all(
          provider.inject.map((item) => {
            if (typeof item === "object") {
              const val = caches.get(item.token);
              if (val === undefined && item.optional !== true) {
                throw new InternalServerErrorException(
                  `FactoryProvider: ${item.token.toString()} not found`,
                );
              }
              return val;
            }
            if (typeof item === "function") {
              return this.initProvider(item, {
                scope: provider.scope,
                caches,
              });
            }
            return item;
          }),
        );
        result = await provider.useFactory(...args);
      } else {
        result = await provider.useFactory();
      }
      caches.set(provider.provide, result);
      return result;
    }
  }

  copyProviderCache(
    item: Provider | symbol,
    oldCache: FactoryCaches,
    newCache: FactoryCaches,
  ) {
    if (isSpecialProvider(item)) {
      const instance = oldCache.get(item.provide);
      newCache.set(item.provide, instance);
    } else {
      const instance = oldCache.get(item);
      newCache.set(item, instance);
    }
  }

  async mapRoute(
    Cls: Constructor,
  ): Promise<RouteMap[]> {
    const instance = await this.create(Cls);
    const prototype = Cls.prototype;
    const result: RouteMap[] = [];
    Object.getOwnPropertyNames(prototype).forEach((item) => {
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

  async getRouterArr(controllers: Constructor[]) {
    const routerArr: RouteItem[] = [];
    await Promise.all(
      controllers.map(async (Cls) => {
        const arr = await this.mapRoute(Cls);
        const path = Reflect.getMetadata(META_PATH_KEY, Cls);
        const aliasOptions = Reflect.getMetadata(META_ALIAS_KEY, Cls);
        const controllerPath = join(path);
        routerArr.push({
          controllerPath,
          arr,
          cls: Cls,
          aliasOptions,
        });
      }),
    );
    return routerArr;
  }

  async getMergedMetas<T>(
    target: InstanceType<Constructor> | null,
    fn: ControllerMethod | null,
    globalMetas: ExceptionFilters | NestGuards | NestUseInterceptors,
    metaKey: string | symbol,
  ): Promise<T[]> {
    const classes = (target && Reflect.getMetadata(metaKey, target)) || [];
    const fns = (fn && Reflect.getOwnMetadata(metaKey, fn)) || [];
    const all = [
      ...globalMetas,
      ...classes,
      ...fns,
    ];
    const arr = await Promise.all(all.map((item) => {
      if (typeof item === "function") {
        return this.create(item, {
          caches: target ? this.instanceCaches.get(target) : undefined,
        });
      }
      return item;
    }));
    // return [...new Set(arr)]; // No need to remove duplicates, it may be controlled by the user
    return arr;
  }
}

export const factory = new ClassFactory();
