export {
  type Context as HonoContext,
  Hono,
  type HonoRequest,
  type MiddlewareHandler as HonoMiddlewareHandler,
  type Next as HonoNext,
} from "hono/mod.ts";

export {
  deleteCookie,
  getCookie,
  getSignedCookie,
  setCookie,
  setSignedCookie,
} from "hono/helper.ts";

export { etag, serveStatic } from "hono/middleware.ts";

export const HonoResponse = Response;
export type HonoResponse = Response;
