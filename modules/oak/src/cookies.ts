import {
  CookiesGetOptions,
  CookiesSetDeleteOptions,
  ICookies,
} from "../../../src/interfaces/context.interface.ts";
import { OakContext } from "../deps.ts";

export class NestCookies implements ICookies {
  constructor(private context: OakContext) {}

  has(name: string, options?: CookiesGetOptions): Promise<boolean> {
    return this.context.cookies.has(name, options);
  }

  async getAll(): Promise<Record<string, string>> {
    const cookies: Record<string, string> = {};
    for await (const [name, value] of this.context.cookies.entries()) {
      cookies[name] = value;
    }
    return cookies;
  }

  async get(
    name: string,
    options?: CookiesGetOptions,
  ): Promise<string | false | undefined> {
    const { signed = false, signedSecret } = options ?? {};
    if (signed && signedSecret) {
      console.warn("signedSecret will be ignored");
    }
    const val = await this.context.cookies.get(name, {
      ...options,
      signed, // set signed to false to keep the same behavior as Hono
    });
    if (signed && val === undefined) {
      const has = await this.has(name, { signed: false });
      if (has) {
        return false;
      }
    }
    return val;
  }

  async set(
    name: string,
    value: string,
    options?: CookiesSetDeleteOptions,
  ): Promise<ICookies> {
    const { signed = false, signedSecret, sameSite } = options ?? {};
    if (signed) {
      if (signedSecret) {
        console.warn("signedSecret will be ignored");
      }
    }
    const site = sameSite
      ? sameSite.toLowerCase() as "strict" | "lax" | "none"
      : undefined;
    await this.context.cookies.set(name, value, {
      ...options,
      sameSite: site,
      signed,
    });
    return this;
  }

  delete(
    name: string,
    options?: CookiesSetDeleteOptions,
  ): ICookies {
    const site = options?.sameSite
      ? options.sameSite.toLowerCase() as "strict" | "lax" | "none"
      : undefined;
    this.context.cookies.delete(name, {
      ...options,
      sameSite: site,
    });
    return this;
  }
}
