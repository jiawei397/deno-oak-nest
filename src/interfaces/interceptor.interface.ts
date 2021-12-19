// deno-lint-ignore-file no-explicit-any
import { Context } from "../../deps.ts";
import { ControllerMethod } from "./guard.interface.ts";
import { Constructor } from "./type.interface.ts";

export type Next = () => Promise<unknown>;

export interface NestInterceptorOptions {
  target: InstanceType<Constructor>;
  args: any[];
  methodName: string;
  methodType: string; // get/post/put/delete
  fn: ControllerMethod;
}

/**
 * Interface describing implementation of an interceptor.
 */
export interface NestInterceptor {
  intercept(
    context: Context,
    next: Next,
    options?: NestInterceptorOptions,
  ): Promise<any>;
}

export type NestUseInterceptors =
  (NestInterceptor | Constructor<NestInterceptor>)[];
