import {
  ListenOptions,
} from "../../../src/interfaces/application.interface.ts";
import { StaticOptions } from "../../../src/interfaces/factory.interface.ts";
import {
  IRouter,
  MiddlewareHandler,
} from "../../../src/interfaces/route.interface.ts";
import { Hono, serveStatic } from "../deps.ts";
import { NestContext } from "./context.ts";

export class HonoRouter implements IRouter {
  private app: Hono;

  constructor(options?: { strict?: boolean }) {
    this.app = new Hono({ strict: options?.strict ?? false });
  }

  get(
    path: string,
    fn: MiddlewareHandler,
  ) {
    return this.app.get(path, async (ctx, next) => {
      const nestCtx = NestContext.getInstance(ctx);
      await fn(nestCtx, next);
      return nestCtx.render();
    });
  }
  post(
    path: string,
    fn: MiddlewareHandler,
  ) {
    return this.app.post(path, async (ctx, next) => {
      const nestCtx = NestContext.getInstance(ctx);
      await fn(nestCtx, next);
      return nestCtx.render();
    });
  }
  put(
    path: string,
    fn: MiddlewareHandler,
  ) {
    return this.app.put(path, async (ctx, next) => {
      const nestCtx = NestContext.getInstance(ctx);
      await fn(nestCtx, next);
      return nestCtx.render();
    });
  }
  delete(
    path: string,
    fn: MiddlewareHandler,
  ) {
    return this.app.delete(path, async (ctx, next) => {
      const nestCtx = NestContext.getInstance(ctx);
      await fn(nestCtx, next);
      return nestCtx.render();
    });
  }

  use(fn: MiddlewareHandler) {
    return this.app.use("*", async (ctx, next) => {
      const nestCtx = NestContext.getInstance(ctx);
      await fn(nestCtx, next);
    });
  }

  routes(): void {
    // empty
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
