import { Context, SendOptions } from "../../deps.ts";
import { ControllerMethod } from "./guard.interface.ts";
import { Type } from "./type.interface.ts";

export interface RouteMap {
  route: string;
  methodType: string;
  fn: ControllerMethod;
  methodName: string;
  instance: InstanceType<Type>;
  cls: Type;
}

export type RouteItem = {
  controllerPath: string;
  arr: RouteMap[];
  cls: Type;
};

export type GzipExtensions = ".js" | ".png" | ".css" | ".html" | ".wasm";

export type GzipOptions = {
  extensions?: GzipExtensions[];
  threshold?: number;
  level?: number;
  filter?: (context: Context, content: Uint8Array) => boolean;
};
/**
 * Interface describing options for serving static assets.
 */
export interface ServeStaticOptions extends Omit<SendOptions, "root" | "gzip"> {
  /**
   * Creates a virtual path prefix
   */
  prefix?: string;

  gzip?: boolean | GzipOptions;
}
