// deno-lint-ignore-file no-explicit-any

import { Context } from "../../deps.ts";
import { Constructor } from "./type.interface.ts";

/**
 * Interface describing implementation of an exception filter.
 *
 * @see [Exception Filters](https://docs.nestjs.com/exception-filters)
 *
 * @publicApi
 */
export interface ExceptionFilter<T = any> {
  /**
   * Method to implement a custom exception filter.
   *
   * @param exception the class of the exception being handled
   * the in-flight request
   */
  catch(exception: T, context: Context): any;
}

export type ExceptionFilters =
  (ExceptionFilter | Constructor<ExceptionFilter>)[];
