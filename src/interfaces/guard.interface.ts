// deno-lint-ignore-file no-explicit-any no-unused-vars
import type { Context } from "../../deps.ts";

export abstract class CanActivate {
  constructor(...args: any[]) {}
  canActivate(context: Context): boolean | Promise<boolean> {
    throw new Error("Method not implemented.");
  }
}

export type ControllerMethod = (...args: any[]) => any;
