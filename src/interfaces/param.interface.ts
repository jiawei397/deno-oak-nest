import type { Context } from "./context.interface.ts";
import type { Instance } from "./type.interface.ts";

export type ParamDecoratorCallback = (
  ctx: Context,
  target: Instance,
  methodName: string,
  index: number,
  // deno-lint-ignore no-explicit-any
) => any;

export interface FormDataOptions {
  maxFileSize?: number;
  /**
   * If true, will not throw error when validate failed, but still can get the fields which is transformed.
   *
   * If you want to skip validate, you may use `interface` or `type` to define the fields, or use the `class DTO` like this:
   * ```ts
   * async sigin(@Form() fields: typeof SigninDto.prototype) { }
   * ```
   */
  ignoreValidate?: boolean;
}

export type ArrayItemType = "boolean" | "number" | "string";
