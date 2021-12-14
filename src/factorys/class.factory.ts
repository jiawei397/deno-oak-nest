// deno-lint-ignore-file no-explicit-any
import { Reflect } from "../../deps.ts";
import { getInjectData } from "../decorators/inject.ts";
import {
  ClassProvider,
  ExistingProvider,
  FactoryProvider,
  Provider,
  Scope,
  Type,
  ValueProvider,
} from "../interfaces/mod.ts";

export const globalFactoryCaches = new Map();

export const setFactoryCaches = (key: any, value: any) => {
  globalFactoryCaches.set(key, value);
};

export const Factory = async <T>(
  target: Type<T>,
  scope: Scope = Scope.DEFAULT,
  factoryCaches = globalFactoryCaches,
): Promise<T> => {
  const paramtypes = Reflect.getMetadata("design:paramtypes", target);
  let args: any[] = [];
  if (paramtypes?.length) {
    args = await Promise.all(
      paramtypes.map((paramtype: Type, index: number) => {
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
        if (scope === Scope.REQUEST) { // TODO I don't quite understand the difference between REQUEST and TRANSIENT, so it maybe error.
          return Factory(paramtype, Scope.DEFAULT);
        } else {
          return Factory(paramtype, scope);
        }
      }),
    );
  }
  if (scope === Scope.DEFAULT) { // singleton
    if (factoryCaches.has(target)) {
      //   console.debug("factory.has cache", target);
      return factoryCaches.get(target);
    }
    const instance = new target(...args);
    setFactoryCaches(target, instance);
    return instance;
  } else {
    return new target(...args);
  }
};

export async function initProvider(
  item: Provider,
  scope: Scope,
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
      return itemProvider.useExisting;
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
