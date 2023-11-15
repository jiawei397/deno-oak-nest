export {
  type Context as HonoContext,
  Hono,
  type HonoRequest,
  type MiddlewareHandler as HonoMiddlewareHandler,
  type Next as HonoNext,
} from "hono/mod.ts";

export {
  deleteCookie,
  etag,
  getCookie,
  getSignedCookie,
  serveStatic,
  type ServeStaticOptions,
  setCookie,
  setSignedCookie,
} from "hono/middleware.ts";

export const HonoResponse = Response;
export type HonoResponse = Response;
