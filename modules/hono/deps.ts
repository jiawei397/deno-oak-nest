export {
  type Context as HonoContext,
  Hono,
  type HonoRequest,
  type MiddlewareHandler as HonoMiddlewareHandler,
  type Next as HonoNext,
} from "hono";

export {
  deleteCookie,
  getCookie,
  getSignedCookie,
  setCookie,
  setSignedCookie,
} from "hono/cookie";

export { serveStatic } from "hono/deno";

export { etag } from "hono/etag";

export const HonoResponse = Response;
export type HonoResponse = Response;
