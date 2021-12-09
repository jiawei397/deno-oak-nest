// deno-lint-ignore-file no-explicit-any
import { Reflect } from "../../deps.ts";
import { InjectedData, Scope, Type } from "../interfaces/mod.ts";
export const factoryCaches = new Map();

export const Factory = async <T>(
  target: Type<T>,
  scope: Scope = Scope.DEFAULT,
): Promise<T> => {
  const providers = Reflect.getMetadata("design:paramtypes", target);
  let args: any[] = [];
  if (providers?.length) {
    args = await Promise.all(
      providers.map((provider: Type, index: number) => {
        const injectedData = Reflect.getMetadata(
          "design:inject" + index,
          target,
        ) as InjectedData;
        if (typeof injectedData?.fn === "function") {
          return injectedData.fn.apply(null, injectedData.params);
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
      console.debug("factory.has cache", target);
      return factoryCaches.get(target);
    }
    const instance = new target(...args);
    factoryCaches.set(target, instance);
    return instance;
  } else {
    return new target(...args);
  }
};
