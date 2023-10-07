import { type Context } from "../deps.ts";

const nestResponseKey = Symbol("nestResponse");

export class NestResponse {
  body: string | object | number | boolean | null;
  headers: Headers = new Headers();
  status = 200;
  statusText = "OK";
  originContext: Context;

  static init(ctx: Context) {
    const res = new NestResponse();
    ctx.set(nestResponseKey, res);
    res.originContext = ctx;
    return res;
  }

  static getNestResponseWithInit(ctx: Context): NestResponse {
    const res = ctx.get(nestResponseKey);
    return res || this.init(ctx);
  }

  static getNestResponse(ctx: Context): NestResponse | null {
    const res = ctx.get(nestResponseKey);
    return res;
  }
}
