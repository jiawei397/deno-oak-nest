export {
  type Context as HonoContext,
  Hono,
  type HonoRequest,
  type MiddlewareHandler as HonoMiddlewareHandler,
  type Next as HonoNext,
} from "hono/mod.ts";

export {
  etag,
  getCookie,
  serveStatic,
  type ServeStaticOptions,
  setCookie,
} from "hono/middleware.ts";

export type HonoResponse = Response;
