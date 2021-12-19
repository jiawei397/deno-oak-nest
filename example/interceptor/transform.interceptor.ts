import { Context, Injectable } from "../../mod.ts";
import {
  NestInterceptor,
  Next,
} from "../../src/interfaces/interceptor.interface.ts";

@Injectable()
export class TransformInterceptor implements NestInterceptor {
  async intercept(_context: Context, next: Next) {
    console.info("TransformInterceptor", "Before ...");
    const data = await next();
    console.info("TransformInterceptor", "After ...");

    // also can change response data or status code
    // context.response.status = 400;
    // context.response.body = { haha: "aha" };
    return {
      data,
    };
  }
}
