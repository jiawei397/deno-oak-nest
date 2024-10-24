// deno-lint-ignore-file no-explicit-any
import type { Context } from "./context.interface.ts";
import type { Constructor } from "./type.interface.ts";

export interface CanActivate {
  canActivate(context: Context): boolean | Promise<boolean>;
}

export type ControllerMethod = (...args: any[]) => any;

export type NestGuard = CanActivate | Constructor<CanActivate>;

export type NestGuards = NestGuard[];
