import { STATUS_TEXT } from "../../../deps.ts";
import { Response } from "../../../src/interfaces/context.interface.ts";
import { type OakContext } from "../deps.ts";

export class NestResponse implements Response {
  body: string | object | number | boolean | null;
  headers: Headers = new Headers();
  status = 200;
  statusText = "OK";
  originContext: OakContext;

  constructor(context: OakContext) {
    this.originContext = context;
    this.status = context.response.status;
    this.statusText = STATUS_TEXT[context.response.status];
  }

  getOriginalResponse<T>(): T {
    return this.originContext.response as T;
  }
}
