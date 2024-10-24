// deno-lint-ignore-file no-explicit-any
import type {
  IRouter,
  ListenOptions,
  MiddlewareHandler,
  NotFoundHandler,
  RouterOptions,
  StaticOptions,
} from "@nest/core";
import {
  Hono,
  type HonoContext,
  type HonoMiddlewareHandler,
  type HonoNext,
  serveStatic,
} from "../deps.ts";
import { NestContext } from "./context.ts";

type HonoMiddleware = Hono<any, { [x: string]: any }, "/">;

export class HonoRouter implements IRouter {
  private app: Hono;
  keys?: string[];

  constructor(options?: RouterOptions) {
    this.app = new Hono({ strict: options?.strict ?? false });
    this.keys = options?.keys;
  }

  private handle(fn: MiddlewareHandler) {
    return async (ctx: HonoContext, next: HonoNext) => {
      const nestCtx = NestContext.getInstance(ctx, undefined, this.keys);
      nestCtx.response.status = 200;
      await fn(nestCtx, next);
      return nestCtx.response.render();
    };
  }

  get(
    path: string,
    fn: MiddlewareHandler,
  ): HonoMiddleware {
    return this.app.get(path, this.handle(fn));
  }
  post(
    path: string,
    fn: MiddlewareHandler,
  ): HonoMiddleware {
    return this.app.post(path, this.handle(fn));
  }
  put(
    path: string,
    fn: MiddlewareHandler,
  ): HonoMiddleware {
    return this.app.put(path, this.handle(fn));
  }
  delete(
    path: string,
    fn: MiddlewareHandler,
  ): HonoMiddleware {
    return this.app.delete(path, this.handle(fn));
  }
  patch(
    path: string,
    fn: MiddlewareHandler,
  ): HonoMiddleware {
    return this.app.patch(path, this.handle(fn));
  }

  use(fn: MiddlewareHandler): HonoMiddleware {
    return this.app.use("*", async (ctx: HonoContext, next: HonoNext) => {
      const nestCtx = NestContext.getInstance(ctx, 404, this.keys);
      await fn(nestCtx, next);
    });
  }

  useOriginMiddleware(fn: HonoMiddlewareHandler, path = "*"): HonoMiddleware {
    return this.app.use(path, fn);
  }

  routes(): void {
    // empty
  }

  notFound(fn: NotFoundHandler): void {
    this.app.notFound(async (ctx) => {
      const nestCtx = NestContext.getInstance(ctx, undefined, this.keys);
      nestCtx.response.status = 404;
      await fn(nestCtx);
      return nestCtx.response.render();
    });
  }

  startServer(options: ListenOptions): Deno.HttpServer<Deno.NetAddr> {
    return Deno.serve(options, this.app.fetch);
  }

  serveForStatic(staticOptions: StaticOptions): void {
    if (!staticOptions) {
      return;
    }
    const prefix = staticOptions.prefix;
    const callback = serveStatic({
      root: staticOptions.baseDir,
      rewriteRequestPath: (path) => {
        // console.log("rewriteRequestPath", path);
        return prefix ? path.replace(prefix, "") : path;
      },
    });
    const path = prefix ? `${prefix}/*` : "*";
    this.app.get(path, callback);
  }
}
