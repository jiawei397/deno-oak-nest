import {
  type Context,
  Injectable,
  type NestInterceptor,
  type Next,
} from "../deps.ts";
import { Logger } from "./types.ts";

/**
 * The difference between LogInterceptor and LogMiddleware is that the latter can capture 404 errors.
 */
export function getLogInterceptor(options?: {
  logger?: Logger;
  logLevel?: "info" | "debug";
  isHeaderResponseTime?: boolean;
}) {
  const logger = options?.logger ?? console;
  const logLevel = options?.logLevel ?? "info";

  @Injectable()
  class LoggingInterceptor implements NestInterceptor {
    async intercept(ctx: Context, next: Next) {
      const start = Date.now();
      await next();
      const time = Date.now() - start;
      const msg =
        `${ctx.request.method} ${ctx.request.url} [${ctx.response.status}] - ${time}ms`;
      logger[logLevel](msg);
      if (options?.isHeaderResponseTime) {
        ctx.response.headers.set("X-Response-Time", `${time}ms`);
      }
    }
  }
  return LoggingInterceptor;
}
