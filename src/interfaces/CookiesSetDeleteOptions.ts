export interface CookiesSetDeleteOptions {
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
   * @warning It only work in `Hono`, and is required when `signed` is `true`.
   * But not work in `oak` because it must set by ``.
   */
  signedSecret?: string;
}
