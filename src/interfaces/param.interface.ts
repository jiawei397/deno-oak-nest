import { Context } from "./context.interface.ts";
import { Instance } from "./type.interface.ts";

export type ParamDecoratorCallback = (
  ctx: Context,
  target: Instance,
  methodName: string,
  index: number
  // deno-lint-ignore no-explicit-any
) => any;

export interface FormDataOptions {
  maxFileSize?: number;
}

export type ArrayItemType = "boolean" | "number" | "string";
