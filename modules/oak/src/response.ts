import { Status, STATUS_TEXT } from "../../../deps.ts";
import { Response } from "../../../src/interfaces/context.interface.ts";
import { type OakContext } from "../deps.ts";

export class NestResponse implements Response {
  body: string | object | number | boolean | null;
  headers: Headers = new Headers();
  status: Status;
  originContext: OakContext;

  constructor(context: OakContext) {
    this.originContext = context;
    this.status = Status.OK;
  }

  get statusText() {
    return STATUS_TEXT[this.status];
  }

  getOriginalResponse<T>(): T {
    return this.originContext.response as T;
  }
}
