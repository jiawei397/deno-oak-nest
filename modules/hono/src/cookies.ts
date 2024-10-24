import type {
  CookiesGetOptions,
  CookiesSetDeleteOptions,
  ICookies,
} from "@nest/core";
import {
  deleteCookie,
  getCookie,
  getSignedCookie,
  type HonoContext,
  setCookie,
  setSignedCookie,
} from "../deps.ts";

export class NestCookies implements ICookies {
  constructor(public context: HonoContext, public keys?: string[]) {}

  async has(name: string, options?: CookiesGetOptions): Promise<boolean> {
    const val = await this.get(name, options);
    return val !== undefined;
  }

  // deno-lint-ignore require-await
  async getAll(): Promise<Record<string, string>> {
    return getCookie(this.context);
  }

  private getSignedSecret(
    options?: CookiesGetOptions,
  ): string | false | undefined {
    const { signed, signedSecret } = options ?? {};
    if (signed && !signedSecret) {
      if (!this.keys) {
        return false;
      }
      return this.keys.join("_");
    }
    return signedSecret;
  }

  async get(
    name: string,
    options?: CookiesGetOptions,
  ): Promise<string | false | undefined> {
    const secret = this.getSignedSecret(options);
    if (secret === false) {
      console.warn("Signed cookies require a secret to be provided");
      return false;
    }
    if (secret) {
      const val = await getSignedCookie(this.context, secret, name);
      if (val === undefined) {
        if (await this.has(name, { signed: false })) {
          return false;
        }
      }
      return val;
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
    if (secret !== undefined) {
      if (secret === false) {
        throw new Error("Signed cookies require a secret to be provided");
      }
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
