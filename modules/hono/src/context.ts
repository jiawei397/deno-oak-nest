import { Status } from "../../../deps.ts";
import { Context } from "../../../src/interfaces/context.interface.ts";
import { HonoContext } from "../deps.ts";
import { NestRequest } from "./request.ts";
import { NestResponse } from "./response.ts";

export const nestContextKey = Symbol("nestContext");

export class NestContext implements Context {
  originalContext: HonoContext;

  request: NestRequest;
  response: NestResponse;

  constructor(context: HonoContext) {
    this.originalContext = context;
    this.request = new NestRequest(context);
    this.response = new NestResponse(context);
  }

  static getInstance(
    context: HonoContext,
    defaultStatus?: Status,
  ): NestContext {
    const nestContext = context.get(nestContextKey);
    if (nestContext) {
      return nestContext;
    }
    const newContext = new NestContext(context);
    context.set(nestContextKey, newContext);
    if (defaultStatus) {
      newContext.response.status = defaultStatus;
    }
    return newContext;
  }

  render(): Response {
    const context = this.originalContext;
    const body = this.response.body;
    if (this.response.status) {
      context.status(this.response.status);
    }
    this.response.headers.forEach((val, key) => {
      context.header(key, val);
    });

    // deal with body
    if (
      body === null || body === undefined || body instanceof ReadableStream ||
      body instanceof ArrayBuffer
    ) {
      return context.body(body);
    }
    const contextType = this.response.headers.get("content-type");
    if (contextType && contextType.includes("application/json")) {
      return context.json(body);
    }
    if (
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
