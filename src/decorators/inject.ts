// deno-lint-ignore-file no-explicit-any
import { InjectParams } from "../interfaces/factory.interface.ts";
import { Reflect } from "../../deps.ts";

export const INJECT_META_KEY = "design:inject";

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

export const Injectable = (): ClassDecorator => (_target) => {};
