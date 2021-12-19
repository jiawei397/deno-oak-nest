// deno-lint-ignore-file no-explicit-any
import { Context } from "../../deps.ts";
import { Constructor } from "./type.interface.ts";

export type Next = () => Promise<unknown>;

/**
 * Interface describing implementation of an interceptor.
 */
export interface NestInterceptor {
  intercept(context: Context, next: Next): Promise<any>;
}

export type NestUseInterceptors =
  (NestInterceptor | Constructor<NestInterceptor>)[];
