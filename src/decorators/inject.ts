// deno-lint-ignore-file no-explicit-any
import { InjectParams } from "../interfaces/factory.interface.ts";
import { Reflect } from "../../deps.ts";
import { Constructor } from "../interfaces/type.interface.ts";

export const INJECT_META_KEY = "design:inject";

export const SINGLETON_MEAT_KEY = "meta:singleton";

/**
 * Inject decorator
 *
 * For example:
 * ```typescript
 * const InjectModel = (name: string) => Inject(() => name);
 * ```
 */
export function Inject(key: InjectParams): ParameterDecorator {
  return (
    target: any,
    _propertyKey: string | symbol,
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

export const Injectable = ({
  singleton = true,
} = {}): ClassDecorator =>
  (target) => {
    if (!singleton) { // default is singleton
      Reflect.defineMetadata(SINGLETON_MEAT_KEY, false, target);
    }
  };

export function isSingleton(Cls: Constructor) {
  if (typeof Cls === "function") {
    const meta = Reflect.getMetadata(SINGLETON_MEAT_KEY, Cls);
    return meta !== false;
  }
  return true;
}
