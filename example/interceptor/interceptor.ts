// deno-lint-ignore-file no-unused-vars
import {
  BadGatewayException,
  type Context,
  Injectable,
  type NestInterceptor,
  Next,
} from "@nest";

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  async intercept(ctx: Context, next: Next) {
    console.log("LoggingInterceptor", "Before...");
    await next();
    console.log("LoggingInterceptor", `After...`);
    const ms = Date.now() - ctx.request.startTime;
    ctx.response.headers.set("X-Response-Time", `${ms}ms`);
    ctx.response.body = {
      success: true,
      data: ctx.response.body,
    };
  }
}

@Injectable()
export class ErrorsInterceptor implements NestInterceptor {
  async intercept(context: Context, next: Next) {
    try {
      await next();
    } catch (error) {
      throw new BadGatewayException("", error.message, error.stack);
      // context.response.status = 500;
      // context.response.body = {
      //   error: error.message,
      // };
    }
  }
}

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  // deno-lint-ignore no-explicit-any
  map: Map<string, any> = new Map();

  async intercept(context: Context, next: Next) {
    if (context.request.method !== "GET") {
      return next();
    }
    const url = context.request.url;
    const isCached = this.map.has(url);
    if (isCached) {
      context.response.body = this.map.get(url);
      return;
    }
    await next();
    this.map.set(url, context.response.body);
  }
}
