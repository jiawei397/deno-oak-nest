import { Status, STATUS_TEXT } from "../../../deps.ts";
import { REDIRECT_BACK } from "../../../src/constants.ts";
import { Response } from "../../../src/interfaces/context.interface.ts";
import { type OakContext } from "../deps.ts";
import { NestCookies } from "./cookies.ts";

export class NestResponse implements Response {
  body: string | object | number | boolean | null;
  headers: Headers = new Headers();
  status: Status;
  originalContext: OakContext;
  cookies: NestCookies;

  constructor(context: OakContext, cookies: NestCookies) {
    this.originalContext = context;
    this.status = Status.OK;
    this.cookies = cookies;
  }

  get statusText() {
    return STATUS_TEXT[this.status];
  }

  getOriginalContext<T>(): T {
    return this.originalContext as T;
  }

  redirect(url: string | typeof REDIRECT_BACK, status?: number): void {
    let location: string;
    if (url === REDIRECT_BACK) {
      const url = this.originalContext.request.headers.get("Referer");
      if (!url) {
        location = this.originalContext.request.url.origin;
      } else {
        location = url;
      }
    } else {
      location = url;
    }
    this.status = status || 302;
    this.originalContext.response.redirect(location);
  }

  render() {
    const context = this.originalContext;
    const body = this.body;
    if (this.status) {
      context.response.status = this.status;
    }
    this.headers.forEach((val, key) => {
      context.response.headers.set(key, val);
    });
    const contextType = this.headers.get("content-type");
    if (!contextType) {
      if (typeof body === "number" || typeof body === "boolean") {
        context.response.headers.set(
          "content-type",
          "application/json; charset=utf-8",
        );
      } else if (typeof body === "string") {
        context.response.headers.set(
          "content-type",
          "text/html; charset=utf-8",
        );
      }
    }

    if (context.response.body === undefined || body !== undefined) {
      context.response.body = body;
    }
  }
}
