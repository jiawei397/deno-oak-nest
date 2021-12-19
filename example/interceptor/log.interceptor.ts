import { Context, Injectable } from "../../mod.ts";
import {
  NestInterceptor,
  Next,
} from "../../src/interfaces/interceptor.interface.ts";

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  async intercept(_context: Context, next: Next) {
    console.log("LoggingInterceptor", "Before...");
    const now = Date.now();
    const result = await next();
    console.log("LoggingInterceptor", `After... ${Date.now() - now}ms`);
    return result; // must return result
  }
}
