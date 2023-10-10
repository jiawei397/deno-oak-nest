// deno-lint-ignore-file no-explicit-any
import { Context } from "./context.interface.ts";
import { Constructor } from "./type.interface.ts";

export interface CanActivate {
  canActivate(context: Context): boolean | Promise<boolean>;
}

export type ControllerMethod = (...args: any[]) => any;

export type NestGuards = (CanActivate | Constructor<CanActivate>)[];
