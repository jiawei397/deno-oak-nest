// deno-lint-ignore-file no-explicit-any
import { ListenOptions } from "./application.interface.ts";
import { Context } from "./context.interface.ts";
import { AliasOptions } from "./controller.interface.ts";
import { StaticOptions } from "./factory.interface.ts";
import { ControllerMethod } from "./guard.interface.ts";
import { Next } from "./middleware.interface.ts";
import { Type } from "./type.interface.ts";

export type MethodType = "get" | "post" | "put" | "delete";

export interface RouteMap {
  methodPath: string;
  methodType: MethodType;
  fn: ControllerMethod;
  methodName: string;
  instance: InstanceType<Type>;
  cls: Type;
  aliasOptions?: AliasOptions;
}

export type RouteItem = {
  controllerPath: string;
  arr: RouteMap[];
  cls: Type;
  aliasOptions?: AliasOptions;
};

export type MiddlewareHandler = (
  context: Context,
  next: Next,
) => Promise<void>;

export abstract class IRouter {
  abstract use(fn: MiddlewareHandler): void;
  abstract get(path: string, fn: MiddlewareHandler): any;
  abstract post(path: string, fn: MiddlewareHandler): any;
  abstract put(path: string, fn: MiddlewareHandler): any;
  abstract delete(path: string, fn: MiddlewareHandler): any;
  abstract startServer(options?: ListenOptions): any;
  abstract serveForStatic(staticOptions?: StaticOptions): void;
  abstract routes(): void;
}

export interface IRouterConstructor extends Function {
  new (options?: RouterOptions): IRouter;
}

export interface RouterOptions {
  /** Determines if routes are matched strictly, where the trailing `/` is not
   * optional.  Defaults to `false`. */
  strict?: boolean;
}
