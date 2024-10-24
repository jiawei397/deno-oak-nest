import type { Context, Status } from "@nest/core";
import type { OakContext } from "../deps.ts";
import { NestCookies } from "./cookies.ts";
import { NestRequest } from "./request.ts";
import { NestResponse } from "./response.ts";

const nestContextKey = "NEST_CONTEXT";

export class NestContext implements Context {
  request: NestRequest;
  response: NestResponse;
  cookies: NestCookies;

  constructor(context: OakContext) {
    this.cookies = new NestCookies(context);
    this.request = new NestRequest(context, this.cookies);
    this.response = new NestResponse(context, this.cookies);
  }

  static getInstance(context: OakContext, status?: Status): NestContext {
    const nestContext = context.state[nestContextKey];
    if (nestContext) {
      return nestContext;
    }
    const newContext = new NestContext(context);
    if (status) {
      newContext.response.status = status;
    }
    context.state[nestContextKey] = newContext;
    return newContext;
  }
}
