import { Context, FormDataBody, FormDataReadOptions } from "../../deps.ts";
import { Constructor, Instance } from "./type.interface.ts";

export type ParamDecoratorCallback = (
  ctx: Context,
  target: Instance,
  methodName: string,
  index: number,
  // deno-lint-ignore no-explicit-any
) => any;

export interface FormDataOptions extends FormDataReadOptions {
  validateCls?: Constructor;
}

export type FormDataFormattedBody<T = Record<string, string>> = FormDataBody & {
  fields: T;
};

export type ArrayItemType = "boolean" | "number" | "string";
