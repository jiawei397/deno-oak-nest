import { Status } from "../../../deps.ts";
import { Context } from "../../../src/interfaces/context.interface.ts";
import { OakContext } from "../deps.ts";
import { NestRequest } from "./request.ts";
import { NestResponse } from "./response.ts";

const nestContextKey = "NEST_CONTEXT";

export class NestContext implements Context {
  request: NestRequest;
  response: NestResponse;

  constructor(context: OakContext) {
    this.request = new NestRequest(context);
    this.response = new NestResponse(context);
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
