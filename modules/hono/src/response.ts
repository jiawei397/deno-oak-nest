import { Status, STATUS_TEXT } from "../../../deps.ts";
import { Response } from "../../../src/interfaces/context.interface.ts";
import { type HonoContext } from "../deps.ts";

export class NestResponse implements Response {
  body: string | object | number | boolean | null;
  headers: Headers = new Headers();
  status: Status;
  originContext: HonoContext;

  constructor(context: HonoContext) {
    this.originContext = context;
    this.status = Status.OK;
  }

  get statusText() {
    return STATUS_TEXT[this.status];
  }

  getOriginalResponse<T>(): T {
    return this.originContext.res as T;
  }
}
