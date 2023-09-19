// deno-lint-ignore-file no-explicit-any ban-types ban-types
import { SendOptions } from "../../deps.ts";

export interface InjectedData {
  fn: Function;
  params: any[];

  scope?: any;
}

export type InjectParams = (() => any) | string | symbol | InjectedData;

/**
 * Interface describing options for serving static assets.
 */
export interface StaticOptions extends Omit<SendOptions, "root"> {
  /**
   * The root directory from which to serve static assets.
   */
  baseDir?: string;
  /**
   * Creates a virtual path prefix
   */
  prefix?: string;
}
