// deno-lint-ignore-file no-explicit-any
import type { Context } from "../deps.ts";

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

export interface Type<T = any> extends Function {
  new (...args: any[]): T;
}

export interface ModuleMetadata {
  /**
   * Optional list of imported modules that export the providers which are
   * required in this module.
   */
  imports: any[];
  /**
   * Optional list of controllers defined in this module which have to be
   * instantiated.
   */
  controllers: Type<any>[];
}

export interface InjectedData {
  // deno-lint-ignore ban-types
  fn: Function;
  params: any[];
}
