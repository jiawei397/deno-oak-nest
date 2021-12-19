import { Context, Injectable } from "../../mod.ts";
import {
  NestInterceptor,
  Next,
} from "../../src/interfaces/interceptor.interface.ts";

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  async intercept(_context: Context, next: Next) {
    console.log("Before...");
    const now = Date.now();
    await next();
    console.log(`After... ${Date.now() - now}ms`);
  }
}
