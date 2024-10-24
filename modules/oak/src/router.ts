import {
  format,
  green,
  type IRouter,
  joinPath,
  type ListenOptions,
  type MiddlewareHandler,
  type Next,
  type NotFoundHandler,
  NotImplementedException,
  resolve,
  type RouterOptions,
  type StaticOptions,
  yellow,
} from "@nest/core";

import {
  OakApplication,
  type OakContext,
  type OakMiddleware,
  OakOriginRouter,
  send,
} from "../deps.ts";
import { NestContext } from "./context.ts";
import type { State } from "oak";

export class OakRouter implements IRouter {
  private router: OakOriginRouter;
  protected app: OakApplication;

  constructor(options?: RouterOptions) {
    this.router = new OakOriginRouter({ strict: options?.strict ?? false });
    this.app = new OakApplication({
      keys: options?.keys,
    });
  }

  useOriginMiddleware(fn: OakMiddleware, path?: string) {
    if (path) {
      throw new NotImplementedException(
        "Not support path in useOriginMiddleware method when use oak framework.",
      );
    }
    this.app.use(fn);
  }

  notFound(fn: NotFoundHandler): void {
    this.app.use(async (ctx, next) => {
      await next();
      if (ctx.response.status !== 404) {
        return;
      }
      const nestCtx = NestContext.getInstance(ctx);
      nestCtx.response.status = 404;
      await fn(nestCtx);
      return nestCtx.response.render();
    });
  }

  private handle(fn: MiddlewareHandler) {
    return async (ctx: OakContext, next: () => Promise<unknown>) => {
      const nestCtx = NestContext.getInstance(ctx);
      nestCtx.response.status = 200;
      await fn(nestCtx, next as Next);
      return nestCtx.response.render();
    };
  }

  get(path: string, fn: MiddlewareHandler): OakOriginRouter<State> {
    return this.router.get(path, this.handle(fn));
  }
  post(path: string, fn: MiddlewareHandler): OakOriginRouter<State> {
    return this.router.post(path, this.handle(fn));
  }
  put(path: string, fn: MiddlewareHandler): OakOriginRouter<State> {
    return this.router.put(path, this.handle(fn));
  }
  delete(path: string, fn: MiddlewareHandler): OakOriginRouter<State> {
    return this.router.delete(path, this.handle(fn));
  }
  patch(path: string, fn: MiddlewareHandler): OakOriginRouter<State> {
    return this.router.patch(path, this.handle(fn));
  }

  use(fn: MiddlewareHandler): OakApplication<State> {
    return this.app.use((ctx: OakContext, next: () => Promise<unknown>) => {
      const nestCtx = NestContext.getInstance(ctx, 404);
      return fn(nestCtx, next as Next);
    });
  }

  routes(): void {
    this.app.use(this.router.routes());
    this.app.use(this.router.allowedMethods());
  }

  startServer(options: ListenOptions): Promise<void> {
    options.onListen!({
      transport: "tcp",
      port: options?.port ?? 8000,
      hostname: options?.hostname ?? "localhost",
    });
    return this.app.listen(options).catch((err) => {
      const errorCallback = options?.onError;
      if (errorCallback) {
        errorCallback(err);
      } else {
        console.error(
          yellow("[Nest]"),
          green(format(new Date(), "yyyy-MM-dd HH:mm:ss")),
          err,
        );
        // Deno.exit(0);
        // Deno.kill(Deno.pid, "SIGINT");
      }
    });
  }

  private async serveStaticAssets(
    context: OakContext,
    options: StaticOptions,
  ) {
    const {
      baseDir,
      prefix,
      ...otherOptions
    } = options;
    const pathname = context.request.url.pathname;
    if (prefix && !pathname.startsWith(joinPath("/", prefix))) {
      return;
    }
    const prefixWithoutSlash = joinPath(prefix || "/");
    const root = resolve(Deno.cwd(), baseDir!);
    const index = "index.html"; // TODO: options.index, `Hono` not support this option, so it`s not a good idea to support it.
    const formattedPath = pathname.replace(prefixWithoutSlash, "");
    try {
      await send(context, formattedPath, {
        ...otherOptions,
        index,
        root,
      });
    } catch {
      context.response.status = 404;
    }
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
    this.app.use(async (context, next) => {
      if (context.request.method !== "GET") {
        return next();
      }
      await next();
      // if (context.response.status !== 404) { // Here status must be 404, because it will be set 404 in notFound method.
      //   return;
      // }
      await this.serveStaticAssets(context, staticOptions);
    });
  }
}
