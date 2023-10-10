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
  constructor() {
    this.app = new Hono();
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

  startServer(options?: ListenOptions) {
    return Deno.serve(options || { port: 8000 }, this.app.fetch);
  }

  /**
   * start serve view and static assets.
   *
   * If has prefix either api or view of static assets, it will be served self without other check, so it`s a good idea to set prefix if you want to have a good performance.
   *
   * Then it will check the extension of the pathname, if it`s optioned such as `ejs`, it will be served view, otherwise it will be served static assets.
   *
   * But if there is index.html in the static assets, it will be served first before the view.
   */
  serveForStatic(staticOptions: StaticOptions) {
    if (!staticOptions) {
      return;
    }
    const prefix = staticOptions.prefix;
    const path = staticOptions.path ? `${staticOptions.path}/*` : "*";
    const callback = serveStatic({
      root: staticOptions.baseDir,
      rewriteRequestPath: (path) => prefix ? path.replace(prefix, "") : path,
    });
    this.app.get(path, callback);
  }
}
