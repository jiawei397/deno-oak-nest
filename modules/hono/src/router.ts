import {
  ListenOptions,
} from "../../../src/interfaces/application.interface.ts";
import { StaticOptions } from "../../../src/interfaces/factory.interface.ts";
import {
  IRouter,
  MiddlewareHandler,
  NotFoundHandler,
} from "../../../src/interfaces/route.interface.ts";
import {
  Hono,
  HonoContext,
  HonoMiddlewareHandler,
  HonoNext,
  serveStatic,
} from "../deps.ts";
import { NestContext } from "./context.ts";

export class HonoRouter implements IRouter {
  private app: Hono;

  constructor(options?: { strict?: boolean }) {
    this.app = new Hono({ strict: options?.strict ?? false });
  }

  private handle(fn: MiddlewareHandler) {
    return async (ctx: HonoContext, next: HonoNext) => {
      const nestCtx = NestContext.getInstance(ctx);
      nestCtx.response.status = 200;
      await fn(nestCtx, next);
      return nestCtx.render();
    };
  }

  get(
    path: string,
    fn: MiddlewareHandler,
  ) {
    return this.app.get(path, this.handle(fn));
  }
  post(
    path: string,
    fn: MiddlewareHandler,
  ) {
    return this.app.post(path, this.handle(fn));
  }
  put(
    path: string,
    fn: MiddlewareHandler,
  ) {
    return this.app.put(path, this.handle(fn));
  }
  delete(
    path: string,
    fn: MiddlewareHandler,
  ) {
    return this.app.delete(path, this.handle(fn));
  }
  patch(
    path: string,
    fn: MiddlewareHandler,
  ) {
    return this.app.patch(path, this.handle(fn));
  }

  use(fn: MiddlewareHandler) {
    return this.app.use("*", async (ctx: HonoContext, next: HonoNext) => {
      const nestCtx = NestContext.getInstance(ctx, 404);
      await fn(nestCtx, next);
    });
  }

  useOriginMiddleware(fn: HonoMiddlewareHandler, path = "*") {
    return this.app.use(path, fn);
  }

  routes(): void {
    // empty
  }

  notFound(fn: NotFoundHandler): void {
    this.app.notFound(async (ctx) => {
      const nestCtx = NestContext.getInstance(ctx);
      nestCtx.response.status = 404;
      await fn(nestCtx);
      return nestCtx.render();
    });
  }

  startServer(options?: ListenOptions) {
    return Deno.serve(options || { port: 8000 }, this.app.fetch);
  }

  serveForStatic(staticOptions: StaticOptions) {
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
