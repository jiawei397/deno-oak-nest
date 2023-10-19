import { Status } from "../../../deps.ts";
import { Context } from "../../../src/interfaces/context.interface.ts";
import { OakContext } from "../deps.ts";
import { NestRequest } from "./request.ts";
import { NestResponse } from "./response.ts";

export const nestContextKey = "NEST_CONTEXT";

export class NestContext implements Context {
  originalContext: OakContext;

  request: NestRequest;
  response: NestResponse;

  constructor(context: OakContext) {
    this.originalContext = context;
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

  render() {
    const context = this.originalContext;
    const body = this.response.body;
    if (this.response.status) {
      context.response.status = this.response.status;
    }
    this.response.headers.forEach((val, key) => {
      context.response.headers.set(key, val);
    });
    const contextType = this.response.headers.get("content-type");
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

    context.response.body = body;
  }
}
