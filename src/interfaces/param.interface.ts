import { Context } from "./context.interface.ts";
import { Constructor, Instance } from "./type.interface.ts";

export type ParamDecoratorCallback = (
  ctx: Context,
  target: Instance,
  methodName: string,
  index: number,
  // deno-lint-ignore no-explicit-any
) => any;

export interface FormDataOptions {
  maxFileSize?: number;
  validateCls?: Constructor;
}

export type FormDataFormattedBody<
  T = Record<string, string | number | boolean>,
> = {
  fields: T;
  original: FormData;
};

export type ArrayItemType = "boolean" | "number" | "string";
