import { Response } from "../../../src/interfaces/context.interface.ts";
import { type HonoContext } from "../deps.ts";

export class NestResponse implements Response {
  body: string | object | number | boolean | null;
  headers: Headers = new Headers();
  status = 200;
  statusText = "OK";
  originContext: HonoContext;

  constructor(context: HonoContext) {
    this.originContext = context;
  }
}
