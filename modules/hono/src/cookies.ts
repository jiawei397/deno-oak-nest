import {
  CookiesGetOptions,
  CookiesSetDeleteOptions,
  ICookies,
} from "../../../src/interfaces/context.interface.ts";
import {
  deleteCookie,
  getCookie,
  getSignedCookie,
  HonoContext,
  setCookie,
  setSignedCookie,
} from "../deps.ts";

export class NestCookies implements ICookies {
  constructor(public context: HonoContext, public keys?: string[]) {}

  async has(name: string): Promise<boolean> {
    const val = await this.get(name);
    return val !== undefined;
  }

  // deno-lint-ignore require-await
  async getAll(): Promise<Record<string, string>> {
    return getCookie(this.context);
  }

  private getSignedSecret(options?: CookiesGetOptions): string | undefined {
    const { signed, signedSecret } = options ?? {};
    if (signed && !signedSecret) {
      if (!this.keys) {
        throw new Error("Signed cookies require a secret to be provided");
      }
      return this.keys.join("_");
    }
    return signedSecret;
  }

  // deno-lint-ignore require-await
  async get(
    name: string,
    options?: CookiesGetOptions,
  ): Promise<string | false | undefined> {
    const secret = this.getSignedSecret(options);
    if (secret) {
      return getSignedCookie(this.context, secret, name);
    } else {
      return getCookie(this.context, name);
    }
  }

  async set(
    name: string,
    value: string,
    options?: CookiesSetDeleteOptions,
  ): Promise<ICookies> {
    const secret = this.getSignedSecret(options);
    if (secret) {
      await setSignedCookie(this.context, name, value, secret, options);
    } else {
      setCookie(this.context, name, value, options);
    }
    return this;
  }

  delete(
    name: string,
    options?: CookiesSetDeleteOptions,
  ): ICookies {
    deleteCookie(this.context, name, options);
    return this;
  }
}
