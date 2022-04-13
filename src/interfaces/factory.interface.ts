// deno-lint-ignore-file no-explicit-any ban-types ban-types
import { Context, SendOptions } from "../../deps.ts";

export interface InjectedData {
  fn: Function;
  params: any[];

  scope?: any;
}

export type InjectParams = (() => any) | string | symbol | InjectedData;

export interface ViewOptions {
  /**
   * the end of the file extension
   * @example ejs
   */
  extension: string;

  /**
   * the root directory of the view
   */
  baseDir: string;

  /**
   * If set, then will serve the view with the given name started
   * @example if prefix is set 'example', then url is like this: http://localhost:3000/example/index.html
   */
  prefix?: string;

  /**
   * render the view with the absolutePath.
   *
   * If not find the view, should throw an error.
   * @returns file content string
   */
  renderFile: (absolutePath: string, context: Context) => Promise<string>;
}

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
export interface StaticOptions extends Omit<SendOptions, "root" | "gzip"> {
  /**
   * The root directory from which to serve static assets.
   */
  baseDir?: string;
  /**
   * Creates a virtual path prefix
   */
  prefix?: string;

  /**
   * If true, will gzip the files, and will generate the corresponding .gz file
   */
  gzip?: boolean | GzipOptions;

  /**
   * If true, will use the oak gzip, it will check the file extension with .gz, if it exists, it will use gzip, otherwise it will not process the file.
   */
  useOriginGzip?: boolean;
}
