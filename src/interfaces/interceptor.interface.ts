// deno-lint-ignore-file no-explicit-any
import { Context } from "../../deps.ts";

/**
 * Interface describing implementation of an interceptor.
 */
export interface NestInterceptor {
  /**
   * If returns a not undefined value, the real execution of the controller method will be skipped.
   */
  pre(context: Context): Promise<any>;

  /**
   * Method to implement a custom interceptor.
   */
  post(context: Context): Promise<any>;
}
