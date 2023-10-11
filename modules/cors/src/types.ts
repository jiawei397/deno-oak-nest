export type StaticOrigin = boolean | string | RegExp | (string | RegExp)[];

export type CustomOrigin = (origin: string) => StaticOrigin;
/**
 * Interface describing CORS options that can be set.
 *
 * @see https://github.com/expressjs/cors
 * @publicApi
 */
export interface CorsOptions {
  /**
   * Configures the `Access-Control-Allow-Origins` CORS header.  See [here for more detail.](https://github.com/expressjs/cors#configuration-options)
   */
  origin?: StaticOrigin | CustomOrigin;
  /**
   * Configures the Access-Control-Allow-Methods CORS header.
   */
  methods?: string | string[];
  /**
   * Configures the Access-Control-Allow-Headers CORS header.
   */
  allowedHeaders?: string | string[];
  /**
   * Configures the Access-Control-Expose-Headers CORS header.
   */
  exposedHeaders?: string | string[];
  /**
   * Configures the Access-Control-Allow-Credentials CORS header.
   */
  credentials?: boolean;
  /**
   * Configures the Access-Control-Max-Age CORS header.
   */
  maxAge?: number;
  /**
   * Whether to pass the CORS preflight response to the next handler.
   */
  preflightContinue?: boolean;
  /**
   * Provides a status code to use for successful OPTIONS requests.
   */
  optionsSuccessStatus?: number;
}

export interface CORSHeader {
  key: string;
  // deno-lint-ignore no-explicit-any
  value: any;
}

export type MultiCORSHeaders = CORSHeader[];

export type CORSHeaders = MultiCORSHeaders[] | CORSHeader[] | null;
