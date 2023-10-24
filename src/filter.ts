// deno-lint-ignore-file no-explicit-any
import { Reflect } from "../deps.ts";
import { ControllerMethod } from "./interfaces/guard.interface.ts";
import { getMergedMetas } from "./factorys/class.factory.ts";
import {
  ExceptionFilter,
  ExceptionFilters,
} from "./interfaces/filter.interface.ts";
import { Constructor, Type } from "./interfaces/type.interface.ts";
import { Context } from "./interfaces/context.interface.ts";
import { HttpException, InternalServerErrorException } from "./exceptions.ts";

export const META_EXCEPTION_FILTER_KEY = Symbol("meta:exception:filter");
export const META_EXCEPTION_CATCH_KEY = Symbol("meta:exception:catch");

/**
 * Decorator that binds exception filters to the scope of the controller or
 * method, depending on its context.
 *
 * When `@UseFilters` is used at the controller level, the filter will be
 * applied to every handler (method) in the controller.
 *
 * When `@UseFilters` is used at the individual handler level, the filter
 * will apply only to that specific method.
 *
 * @param filters exception filter instance or class, or a list of exception
 * filter instances or classes.
 *
 * @see [Exception filters](https://docs.nestjs.com/exception-filters)
 *
 * @usageNotes
 * Exception filters can also be set up globally for all controllers and routes
 * using `app.useGlobalFilters()`.  [See here for details](https://docs.nestjs.com/exception-filters#binding-filters)
 *
 * @publicApi
 */
export function UseFilters(
  ...filters: ExceptionFilters
): MethodDecorator & ClassDecorator {
  return function (
    target: any,
    _property?: string | symbol,
    descriptor?: TypedPropertyDescriptor<any>,
  ) {
    Reflect.defineMetadata(
      META_EXCEPTION_FILTER_KEY,
      filters,
      descriptor ? descriptor.value : target.prototype,
    );
  };
}

/**
 * Decorator that marks a class as a Nest exception filter. An exception filter
 * handles exceptions thrown by or not handled by your application code.
 *
 * The decorated class must implement the `ExceptionFilter` interface.
 *
 * @param exceptions one or more exception *types* specifying
 * the exceptions to be caught and handled by this filter.
 *
 * @see [Exception Filters](https://docs.nestjs.com/exception-filters)
 *
 * @usageNotes
 * Exception filters are applied using the `@UseFilters()` decorator, or (globally)
 * with `app.useGlobalFilters()`.
 *
 * @publicApi
 */
export function Catch(
  ...exceptions: Array<Type<any>>
): ClassDecorator {
  return function (target: any) {
    Reflect.defineMetadata(
      META_EXCEPTION_CATCH_KEY,
      exceptions,
      target.prototype,
    );
  };
}

export function getExceptionFilters(
  target: InstanceType<Constructor> | null,
  fn: ControllerMethod | null,
  globalFilters: ExceptionFilters,
): Promise<ExceptionFilter[]> {
  return getMergedMetas<ExceptionFilter>(
    target,
    fn,
    globalFilters,
    META_EXCEPTION_FILTER_KEY,
  );
}

export async function checkByFilters(
  context: Context,
  target: InstanceType<Constructor>,
  globalFilters: ExceptionFilters,
  fn: ControllerMethod | null,
  error: Error,
): Promise<any> {
  const filters = await getExceptionFilters(target, fn, globalFilters);
  let tempError = error;
  for (let len = filters.length, i = len - 1; i >= 0; i--) {
    const filter = filters[i];
    const catchedExceptions: Array<Type> = Reflect.getMetadata(
      META_EXCEPTION_CATCH_KEY,
      filter,
    );
    if (catchedExceptions) {
      const isOne = catchedExceptions.length === 0
        ? true
        : catchedExceptions.some((exceptionCls) =>
          tempError instanceof exceptionCls
        );
      if (isOne) {
        try {
          return await filter.catch(tempError, context);
        } catch (err) {
          tempError = err;
        }
      }
    }
  }
  throw tempError;
}

@Catch()
export class DefaultGlobalExceptionFilter implements ExceptionFilter {
  catch(exception: Error, context: Context) {
    const err = exception instanceof HttpException
      ? exception
      : new InternalServerErrorException(exception.message || exception);
    context.response.body = err.response;
    context.response.status = err.status;
  }
}
