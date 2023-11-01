import { type Context, Injectable, NestInterceptor, Next } from "@nest";

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  async intercept(ctx: Context, next: Next) {
    console.log("LoggingInterceptor", "Before...");
    const start = Date.now();
    await next();
    console.log("LoggingInterceptor", `After...`);
    const ms = Date.now() - start;
    ctx.response.headers.set("X-Response-Time", `${ms}ms`);
  }
}
