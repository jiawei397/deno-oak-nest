// deno-lint-ignore-file no-explicit-any
import { Status } from "../../deps.ts";
import { REDIRECT_BACK } from "../constants.ts";

export type RedirectStatusCode = 300 | 301 | 302 | 303 | 304 | 307 | 308;

export interface Request {
  startTime: number;
  getOriginalRequest<T>(): T;
  cookies: ICookies;
  get url(): string;
  get method(): string;
  states: Record<string, any>;
  headers(): Headers;
  header(name: string): string | undefined;
  params(): Record<string, string>;
  param(name: string): string | undefined;
  /**
   * Get multiple query param values
   */
  queries(name: string): string[];
  /**
   * Get a specific query param value
   */
  query(name: string): string | undefined;
  json(): Promise<any>;
  text(): Promise<string>;
  formData(): Promise<FormData>;
  // form(): Promise<URLSearchParams>;
}

export interface CookiesGetOptions {
  /**
   * When signed is true, you must provide a secret string `signedSecret` to be used for signing in `Hono` or set `keys` when app is created.
   * Such as:
   * ```ts
   * const app = await NestFactory.create(AppModule, Router, {
   *   keys: ["nest"],
   * });
   * ```
   */
  signed?: boolean;
  /**
   * A secret key that can be used to verify the integrity of the cookie's value.
   *
   * @warning It only work in `Hono` when `signed` is `true`. Its order is before than `keys` when app is created.
   *
   * But will be ignored in `oak` because it only support set by `NestFactory.create` keys options.
   */
  signedSecret?: string;
}

export interface CookiesSetDeleteOptions extends CookiesGetOptions {
  domain?: string;
  expires?: Date;
  httpOnly?: boolean;
  /**
   * For use in situations where requests are presented to Deno as "insecure"
   * but are otherwise secure and so secure cookies can be treated as secure.
   * @warning This only work in `oak`, not work in `Hono`.
   */
  ignoreInsecure?: boolean;
  maxAge?: number;
  // overwrite?: boolean;
  path?: string;
  secure?: boolean;
  sameSite?: "Strict" | "Lax" | "None";
}

export interface ICookies {
  getAll(): Promise<Record<string, string>>;
  /**
   * Get a specific cookie value
   * @returns When signed is true, if the signature is invalid, it will return `false`. Otherwise, it will return the cookie value.
   */
  get(
    name: string,
    options?: CookiesGetOptions,
  ): Promise<string | false | undefined>;

  has(name: string, options?: CookiesGetOptions): Promise<boolean>;

  set(
    name: string,
    value: string | null,
    options?: CookiesSetDeleteOptions,
  ): Promise<ICookies>;
  delete(name: string, options?: CookiesSetDeleteOptions): ICookies;
}

export interface Response {
  cookies: ICookies;
  getOriginalContext<T>(): T;
  body: string | object | number | boolean | null;
  headers: Headers;
  status: Status;
  readonly statusText: string;
  /**
   * This method should only called in middleware.
   *
   * If you changed the response body, status, headers in middleware, you must call this method to render the response.
   * Nevertheless, this can cause the render to be executed repeatedly. The processing of all more reasonable modification responses is in the interceptor, not in the middleware.
   * @warning not recommended to call this method directly, unless you know what you are doing.
   */
  render(): any;

  redirect(
    url: string | typeof REDIRECT_BACK,
    status?: RedirectStatusCode,
  ): void;
}

export interface Context {
  request: Request;
  response: Response;
  cookies: ICookies;
}
