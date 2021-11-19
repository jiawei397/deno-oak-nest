// deno-lint-ignore-file no-explicit-any
import { OakCookie, Request, Response } from "../deps.ts";

export interface Context {
  /** An object which contains information about the current request. */
  request: Request;

  /** An object which contains information about the response that will be sent
   * when the middleware finishes processing. */
  response: Response;
  /** Determines if the request should be responded to.  If `false` when the
   * middleware completes processing, the response will not be sent back to the
   * requestor.  Typically this is used if the middleware will take over low
   * level processing of requests and responses, for example if using web
   * sockets.  This automatically gets set to `false` when the context is
   * upgraded to a web socket via the `.upgrade()` method.
   *
   * The default is `true`. */
  respond: boolean;
  /** An object which allows access to cookies, mediating both the request and
   * response. */
  cookies: OakCookie;
}

export interface CanActivate {
  canActivate(context: Context): boolean | Promise<boolean>;
}

export type Constructor<T = any> = new (...args: any[]) => T;

export type ControllerMethod = (...args: any[]) => any;

export interface RouteMap {
  route: string;
  method: string;
  fn: ControllerMethod;
  methodName: string;
  instance: Record<string, unknown>;
  cls: Constructor;
}
