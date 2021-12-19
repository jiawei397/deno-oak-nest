// deno-lint-ignore-file no-explicit-any
import { Context } from "../../deps.ts";

export type Next = () => Promise<unknown>;

/**
 * Interface describing implementation of an interceptor.
 */
export interface NestInterceptor {
  intercept(context: Context, next: Next): Promise<any>;
}
