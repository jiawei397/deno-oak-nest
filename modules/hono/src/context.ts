import type { Context, StatusCode } from "@nest/core";
import type { HonoContext } from "../deps.ts";
import { NestCookies } from "./cookies.ts";
import { NestRequest } from "./request.ts";
import { NestResponse } from "./response.ts";

const nestContextKey = "__nest_context";

export class NestContext implements Context {
  request: NestRequest;
  response: NestResponse;
  cookies: NestCookies;

  constructor(context: HonoContext, keys?: string[]) {
    this.cookies = new NestCookies(context, keys);
    this.request = new NestRequest(context, this.cookies);
    this.response = new NestResponse(context, this.cookies);
  }

  static getInstance(
    context: HonoContext,
    defaultStatus?: StatusCode,
    keys?: string[],
  ): NestContext {
    const nestContext = context.get(nestContextKey);
    if (nestContext) {
      return nestContext;
    }
    const newContext = new NestContext(context, keys);
    context.set(nestContextKey, newContext);
    if (defaultStatus) {
      newContext.response.status = defaultStatus;
    }
    return newContext;
  }
}
