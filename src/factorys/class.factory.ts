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

export const factoryCaches = new Map();

export const setFactoryCaches = (key: any, value: any) => {
  factoryCaches.set(key, value);
};

export const Factory = async <T>(
  target: Type<T>,
  scope: Scope = Scope.DEFAULT,
): Promise<T> => {
  const providers = Reflect.getMetadata("design:paramtypes", target);
  let args: any[] = [];
  if (providers?.length) {
    args = await Promise.all(
      providers.map((provider: Type, index: number) => {
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
          return Factory(provider, Scope.DEFAULT);
        } else {
          return Factory(provider, scope);
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

export async function initProvider(item: Provider, scope?: Scope) {
  if (!item) {
    return;
  }

  if (item instanceof Function) {
    return Factory(item, scope);
  }

  if (item.provide) {
    if ("useExisting" in item) { // TODO not get how to use it
      const itemProvider = item as ExistingProvider;
      const existingInstance = Factory(itemProvider.useExisting);
      if (!existingInstance) {
        throw new Error(
          `ExistingProvider: ${itemProvider.useExisting} not found`,
        );
      }
      setFactoryCaches(itemProvider.provide, existingInstance);
      return itemProvider.useExisting;
    } else if ("useValue" in item) {
      const itemProvider = item as ValueProvider;
      setFactoryCaches(itemProvider.provide, itemProvider.useValue);
      return itemProvider.useValue;
    } else if ("useClass" in item) {
      const itemProvider = item as ClassProvider;
      return Factory(itemProvider.useClass, itemProvider.scope);
    } else if ("useFactory" in item) {
      const itemProvider = item as FactoryProvider;
      if (itemProvider.inject?.length) {
        const args = await Promise.all(
          itemProvider.inject.map((item: any) => {
            if (item instanceof Function) {
              return Factory(item, itemProvider.scope);
            }
            return item;
          }),
        );
        return itemProvider.useFactory(...args);
      } else {
        return itemProvider.useFactory();
      }
    }
  }
}
