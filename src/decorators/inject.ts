// deno-lint-ignore-file no-explicit-any
import type { InjectParams } from "../interfaces/factory.interface.ts";
import { Reflect } from "../deps.ts";
import type { Constructor } from "../interfaces/type.interface.ts";
import { Scope } from "../interfaces/scope-options.interface.ts";

export const INJECT_META_KEY = "design:inject";

export const SINGLETON_MEAT_KEY = "meta:singleton";

/**
 * Inject decorator
 * @example
 * ```typescript
 * const InjectModel = (name: string) => Inject(() => name);
 * ```
 */
export function Inject(key: InjectParams): ParameterDecorator {
  return (
    target: any,
    _propertyKey: unknown,
    parameterIndex: number,
  ) => {
    Reflect.defineMetadata(INJECT_META_KEY + parameterIndex, key, target);
  };
}

export function getInjectData(
  target: any,
  parameterIndex: number,
): InjectParams {
  return Reflect.getMetadata(INJECT_META_KEY + parameterIndex, target);
}

type InjectableOptions = {
  scope?: Scope;
};

export const Injectable =
  (options?: InjectableOptions): ClassDecorator => (target) => {
    if (options?.scope === Scope.TRANSIENT) { // default is singleton, no need to set alone
      Reflect.defineMetadata(SINGLETON_MEAT_KEY, options.scope, target);
    }
  };

export function isSingleton(Cls: Constructor): boolean {
  if (typeof Cls === "function") {
    const meta = Reflect.getMetadata(SINGLETON_MEAT_KEY, Cls);
    return meta !== Scope.TRANSIENT;
  }
  return true;
}
