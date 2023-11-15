import { Status, STATUS_TEXT } from "../../../deps.ts";
import { Response } from "../../../src/interfaces/context.interface.ts";
import { type HonoContext, HonoResponse } from "../deps.ts";
import { NestCookies } from "./cookies.ts";

export class NestResponse implements Response {
  body: string | object | number | boolean | null;
  headers: Headers = new Headers();
  status: Status;
  originalContext: HonoContext;

  constructor(context: HonoContext, public cookies: NestCookies) {
    this.originalContext = context;
    this.status = Status.OK;
  }

  get statusText() {
    return STATUS_TEXT[this.status];
  }

  getOriginalContext<T>(): T {
    return this.originalContext as T;
  }

  render(): HonoResponse {
    const body = this.body;
    if (body && body instanceof HonoResponse) {
      return body;
    }
    const context = this.originalContext;
    if (this.status) {
      context.status(this.status);
    }
    this.headers.forEach((val, key) => {
      context.header(key, val);
    });

    // deal with body
    if (
      body === null || body === undefined || body instanceof ReadableStream ||
      body instanceof ArrayBuffer
    ) {
      return context.body(body);
    }

    const contextType = this.headers.get("content-type");
    if (
      (contextType && contextType.includes("application/json")) ||
      typeof body === "object" || typeof body === "number" ||
      typeof body === "boolean"
    ) {
      return context.json(body);
    }
    if (contextType && contextType.includes("text/plain")) {
      return context.text(body);
    }
    return context.html(body);
  }
}
