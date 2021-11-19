// deno-lint-ignore-file no-explicit-any
import { Context } from "../deps.ts";

export interface CanActivate {
  canActivate(context: Context): boolean | Promise<boolean>;
}

export type Constructor<T = any> = new (...args: any[]) => T;

export type ControllerMethod = (...args: any[]) => any;

export interface RouteMap {
  route: string;
  method: string;
  fn: ControllerMethod;
  methodName: string;
  instance: Record<string, unknown>;
  cls: Constructor;
}
