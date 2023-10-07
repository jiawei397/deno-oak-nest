import { Context, Injectable, NestInterceptor, Next } from "../../mod.ts";

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  async intercept(ctx: Context, next: Next) {
    // console.log("LoggingInterceptor", "Before...");
    const start = Date.now();
    const result = await next();
    // console.log("LoggingInterceptor", `After...`);
    const ms = Date.now() - start;
    ctx.res.headers.set("X-Response-Time", `${ms}ms`);
    return result; // must return result
  }
}
