// deno-lint-ignore-file no-explicit-any
import { Reflect } from "../../deps.ts";
import { INQUIRER } from "../constants.ts";
import { getInjectData, isSingleton } from "../decorators/inject.ts";
import { InternalServerErrorException } from "../exceptions.ts";
import type {
  ClassProvider,
  Constructor,
  ControllerMethod,
  ExceptionFilters,
  ExistingProvider,
  FactoryProvider,
  NestGuards,
  NestUseInterceptors,
  Provider,
  ValueProvider,
} from "../interfaces/mod.ts";
import { Scope } from "../interfaces/mod.ts";

export const globalFactoryCaches = new Map();

export const setFactoryCaches = (key: any, value: any) => {
  globalFactoryCaches.set(key, value);
};

export function clearAllFactoryCaches() {
  globalFactoryCaches.clear();
}

export const Factory = <T>(
  target: Constructor<T>,
  scope: Scope = Scope.DEFAULT,
  factoryCaches = globalFactoryCaches,
  parentClass?: Constructor,
): Promise<T> => {
  const singleton = isSingleton(target) && scope === Scope.DEFAULT;
  if (singleton) {
    if (factoryCaches.has(target)) {
      //   console.debug("factory.has cache", target);
      return factoryCaches.get(target);
    }
  }
  const instance = getInstance(target, scope, factoryCaches, parentClass);
  if (singleton) {
    factoryCaches.set(target, instance);
  }
  return instance;
};

export const getInstance = async <T>(
  target: Constructor<T>,
  scope: Scope = Scope.DEFAULT,
  factoryCaches = globalFactoryCaches,
  parentClass?: Constructor,
): Promise<T> => {
  if (!target || (typeof target !== "object" && typeof target !== "function")) {
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
            typeof injectedData === "string" || typeof injectedData === "symbol"
          ) {
            if (INQUIRER === injectedData) { // inject parentClass
              return parentClass;
            }
            return factoryCaches.get(injectedData);
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
        const param = await Factory(paramtype, scope, factoryCaches, target);
        return param;
      }),
    );
  }
  const instance = new target(...args);
  return instance;
};

export async function initProvider(
  item: Provider,
  scope = Scope.DEFAULT,
  cache = globalFactoryCaches,
) {
  if (item instanceof Function) {
    return Factory(item, scope, cache);
  }

  if (item.provide) {
    if ("useExisting" in item) { // TODO not get how to use it
      const itemProvider = item as ExistingProvider;
      const existingInstance = Factory(itemProvider.useExisting, scope, cache);
      if (!existingInstance) {
        throw new Error(
          `ExistingProvider: ${itemProvider.useExisting} not found`,
        );
      }
      cache.set(itemProvider.provide, existingInstance);
      return existingInstance;
    } else if ("useValue" in item) {
      const itemProvider = item as ValueProvider;
      cache.set(itemProvider.provide, itemProvider.useValue);
      return itemProvider.useValue;
    } else if ("useClass" in item) {
      const itemProvider = item as ClassProvider;
      return Factory(itemProvider.useClass, itemProvider.scope, cache);
    } else if ("useFactory" in item) {
      const itemProvider = item as FactoryProvider;
      let result;
      if (itemProvider.inject?.length) {
        const args = await Promise.all(
          itemProvider.inject.map((item) => {
            if (typeof item === "object") {
              const val = cache.get(item.token);
              if (val === undefined && item.optional !== true) {
                throw new InternalServerErrorException(
                  `FactoryProvider: ${item.token.toString()} not found`,
                );
              }
              return val;
            }
            if (typeof item === "function") {
              return initProvider(item, itemProvider.scope, cache);
            }
            return item;
          }),
        );
        result = await itemProvider.useFactory(...args);
      } else {
        result = await itemProvider.useFactory();
      }
      cache.set(itemProvider.provide, result);
      return result;
    }
  }
  return item;
}

export async function getMergedMetas<T>(
  target: InstanceType<Constructor> | null,
  fn: ControllerMethod | null,
  globalMetas: ExceptionFilters | NestGuards | NestUseInterceptors,
  metaKey: string | symbol,
): Promise<T[]> {
  const classes = (target && Reflect.getMetadata(metaKey, target)) || [];
  const fns = (fn && Reflect.getOwnMetadata(metaKey, fn)) || [];
  const filters = [
    ...globalMetas,
    ...classes,
    ...fns,
  ];
  const arr = await Promise.all(filters.map((filter) => {
    if (typeof filter === "function") {
      return Factory(filter);
    }
    return filter;
  }));
  // return [...new Set(arr)]; // No need to remove duplicates, it may be controlled by the user
  return arr;
}
