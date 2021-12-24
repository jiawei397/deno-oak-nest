// deno-lint-ignore-file no-explicit-any
import type { Context } from "../../deps.ts";

export interface CanActivate {
  canActivate(context: Context): boolean | Promise<boolean>;
}

export interface Guard {
  new (...args: any[]): CanActivate;
}

export type ControllerMethod = (...args: any[]) => any;
