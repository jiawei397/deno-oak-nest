import { Status } from "../../../deps.ts";
import { Context } from "../../../src/interfaces/context.interface.ts";
import { HonoContext } from "../deps.ts";
import { NestRequest } from "./request.ts";
import { NestResponse } from "./response.ts";

const nestContextKey = Symbol("nestContext");

export class NestContext implements Context {
  request: NestRequest;
  response: NestResponse;

  constructor(context: HonoContext) {
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
}
