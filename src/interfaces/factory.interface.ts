// deno-lint-ignore-file no-explicit-any ban-types ban-types
export interface InjectedData {
  fn: Function;
  params: any[];

  scope?: any;
}

export type InjectParams = (() => any) | string | symbol | InjectedData;

/**
 * Interface describing options for serving static assets.
 */
export interface StaticOptions {
  /**
   * The root directory from which to serve static assets.
   */
  baseDir?: string;
  /**
   * Creates a virtual path prefix
   */
  prefix?: string;

  // path?: string;
  // rewriteRequestPath?: (path: string) => string;

  // index?: string;
}

export type FactoryCreateOptions = {
  strict?: boolean;
  cache?: Map<any, any>;
};
