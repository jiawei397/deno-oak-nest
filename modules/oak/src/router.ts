import { resolve } from "../../../deps.ts";
import { join } from "../../../src/application.ts";
import {
  ListenOptions,
} from "../../../src/interfaces/application.interface.ts";
import { StaticOptions } from "../../../src/interfaces/factory.interface.ts";
import { Next } from "../../../src/interfaces/middleware.interface.ts";
import {
  IRouter,
  MiddlewareHandler,
} from "../../../src/interfaces/route.interface.ts";
import { OakApplication, OakContext, OakOriginRouter, send } from "../deps.ts";
import { NestContext } from "./context.ts";

export class OakRouter implements IRouter {
  private router: OakOriginRouter;
  private app: OakApplication;

  constructor(options?: { strict?: boolean }) {
    this.router = new OakOriginRouter({ strict: options?.strict ?? false });
    this.app = new OakApplication();
  }

  get(
    path: string,
    fn: MiddlewareHandler,
  ) {
    return this.router.get(path, async (ctx, next) => {
      const nestCtx = NestContext.getInstance(ctx);
      await fn(nestCtx, next as Next);
      return nestCtx.render();
    });
  }
  post(
    path: string,
    fn: MiddlewareHandler,
  ) {
    return this.router.post(path, async (ctx, next) => {
      const nestCtx = NestContext.getInstance(ctx);
      await fn(nestCtx, next as Next);
      return nestCtx.render();
    });
  }
  put(
    path: string,
    fn: MiddlewareHandler,
  ) {
    return this.router.put(path, async (ctx, next) => {
      const nestCtx = NestContext.getInstance(ctx);
      await fn(nestCtx, next as Next);
      return nestCtx.render();
    });
  }
  delete(
    path: string,
    fn: MiddlewareHandler,
  ) {
    return this.router.delete(path, async (ctx, next) => {
      const nestCtx = NestContext.getInstance(ctx);
      await fn(nestCtx, next as Next);
      return nestCtx.render();
    });
  }

  use(fn: MiddlewareHandler) {
    return this.router.use(async (ctx, next) => {
      const nestCtx = NestContext.getInstance(ctx);
      await fn(nestCtx, next as Next);
    });
  }

  routes(): void {
    this.app.use(this.router.routes());
    this.app.use(this.router.allowedMethods());
  }

  startServer(options?: ListenOptions) {
    const listenCallback = options?.onListen || function ({ port, hostname }) {
      console.log(`Listening on http://${hostname}:${port}/`);
    };
    listenCallback({
      port: options?.port ?? 8000,
      hostname: options?.hostname ?? "localhost",
    });
    return this.app.listen(options).catch((err) => {
      const errorCallback = options?.onError;
      if (errorCallback) {
        errorCallback(err);
      } else {
        console.error(err);
      }
    });
  }

  private serveStaticAssets(
    context: OakContext,
    options: StaticOptions,
  ) {
    if (!options) {
      return;
    }
    const {
      baseDir,
      prefix,
      ...otherOptions
    } = options;
    const pathname = context.request.url.pathname;
    if (prefix && !pathname.startsWith(join("/", prefix))) {
      return;
    }
    const prefixWithoutSlash = join(prefix || "/");
    const root = resolve(Deno.cwd(), baseDir!);
    const index = "index.html"; // TODO: options.index;
    if (!prefixWithoutSlash) {
      return send(context, "", {
        ...otherOptions,
        index,
        root,
      });
    }

    const formattedPath = pathname.replace(prefixWithoutSlash, "");
    const sendFile = async () => {
      try {
        await send(context, formattedPath, {
          ...otherOptions,
          index,
          root,
        });
      } catch {
        context.response.status = 404;
      }
    };
    return sendFile();
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
      if (context.response.status !== 404) {
        return;
      }
      await this.serveStaticAssets(context, staticOptions);
    });
  }
}