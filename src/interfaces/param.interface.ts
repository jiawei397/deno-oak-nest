import { Context } from "../../deps.ts";
import { Instance } from "./type.interface.ts";

export type ParamDecoratorCallback = (
  ctx: Context,
  target: Instance,
  methodName: string,
  index: number,
  // deno-lint-ignore no-explicit-any
) => any;
