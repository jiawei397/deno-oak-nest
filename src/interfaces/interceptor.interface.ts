// deno-lint-ignore-file no-explicit-any
import type { Context } from "./context.interface.ts";
import type { ControllerMethod } from "./guard.interface.ts";
import type { Next } from "./middleware.interface.ts";
import type { Constructor } from "./type.interface.ts";

export interface NestInterceptorOptions {
  target: InstanceType<Constructor>;
  args: any[];
  methodName: string;
  methodType: string; // get/post/put/delete
  fn: ControllerMethod;
  next: Next;
}

/**
 * Interface describing implementation of an interceptor.
 */
export interface NestInterceptor {
  intercept(
    context: Context,
    next: Next,
    options?: NestInterceptorOptions,
  ): Promise<void>;
}

export type NestUseInterceptors =
  (NestInterceptor | Constructor<NestInterceptor>)[];
