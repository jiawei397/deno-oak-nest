// deno-lint-ignore-file no-explicit-any
import { Reflect } from "../../deps.ts";
import { getInjectData, isSingleton } from "../decorators/inject.ts";
import {
  ClassProvider,
  ExistingProvider,
  FactoryProvider,
  Provider,
  Scope,
  Type,
  ValueProvider,
} from "../interfaces/mod.ts";

export const META_CONTAINER_KEY = "meta:container"; // the container of the class
export const globalFactoryCaches = new Map();

export const setFactoryCaches = (key: any, value: any) => {
  globalFactoryCaches.set(key, value);
};

export function clearAllFactoryCaches() {
  globalFactoryCaches.clear();
}

export const Factory = <T>(
  target: Type<T>,
  scope: Scope = Scope.DEFAULT,
  factoryCaches = globalFactoryCaches,
): Promise<T> => {
  const singleton = isSingleton(target) && scope === Scope.DEFAULT;
  if (singleton) {
    if (factoryCaches.has(target)) {
      //   console.debug("factory.has cache", target);
      return factoryCaches.get(target);
    }
  }
  const instance = getInstance(target, scope, factoryCaches);
  if (singleton) {
    factoryCaches.set(target, instance);
  }
  return instance;
};

export const getInstance = async <T>(
  target: Type<T>,
  scope: Scope = Scope.DEFAULT,
  factoryCaches = globalFactoryCaches,
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
      paramtypes.map(async (paramtype: Type, index: number) => {
        const injectedData = getInjectData(target, index);
        if (injectedData) {
          if (
            typeof injectedData === "string" || typeof injectedData === "symbol"
          ) {
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
        let param;
        if (scope === Scope.REQUEST) { // TODO I don't quite understand the difference between REQUEST and TRANSIENT, so it maybe error.
          param = await Factory(paramtype, Scope.DEFAULT, factoryCaches);
        } else {
          param = await Factory(paramtype, scope, factoryCaches);
        }
        if (!isSingleton(paramtype)) {
          Reflect.defineMetadata(META_CONTAINER_KEY, target, param);
        }
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
  if (!item) {
    return;
  }

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
          itemProvider.inject.map((item: any) => {
            if (item instanceof Function) {
              return Factory(item, itemProvider.scope, cache);
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
}
