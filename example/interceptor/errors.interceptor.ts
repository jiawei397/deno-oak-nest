import { Context, Injectable } from "../../mod.ts";
import {
  NestInterceptor,
  Next,
} from "../../src/interfaces/interceptor.interface.ts";
import { BadGatewayException } from "../deps.ts";

@Injectable()
export class ErrorsInterceptor implements NestInterceptor {
  async intercept(_context: Context, next: Next) {
    try {
      return await next();
    } catch (err) {
      throw new BadGatewayException(err);
    }
  }
}
