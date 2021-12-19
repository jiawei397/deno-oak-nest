// deno-lint-ignore-file no-explicit-any
import { Context, Reflect } from "../deps.ts";
import { Factory } from "./factorys/class.factory.ts";
import { ControllerMethod } from "./interfaces/guard.interface.ts";
import {
  NestInterceptor,
  NestUseInterceptors,
  Next,
} from "./interfaces/interceptor.interface.ts";
import { Constructor } from "./interfaces/type.interface.ts";
export const META_INTERCEPTOR_KEY = Symbol("meta:interceptor");

export function UseInterceptors(...interceptors: NestUseInterceptors) {
  return function (
    target: any,
    _property?: string | symbol,
    descriptor?: TypedPropertyDescriptor<any>,
  ) {
    Reflect.defineMetadata(
      META_INTERCEPTOR_KEY,
      interceptors,
      descriptor ? descriptor.value : target.prototype,
    );
  };
}

function getInterceptors(
  target: InstanceType<Constructor>,
  fn: ControllerMethod,
  globalInterceptors: NestUseInterceptors,
): Promise<NestInterceptor[]> {
  const classInterceptors = Reflect.getMetadata(META_INTERCEPTOR_KEY, target) ||
    [];
  const fnInterceptors = Reflect.getMetadata(META_INTERCEPTOR_KEY, fn) || [];
  const interceptors = [
    ...globalInterceptors,
    ...classInterceptors,
    ...fnInterceptors,
  ];
  return Promise.all(interceptors.map(async (interceptor) => {
    let _interceptor = interceptor;
    if (typeof interceptor === "function") {
      _interceptor = await Factory(interceptor);
    }
    return _interceptor;
  }));
}

export async function checkByInterceptors(
  target: InstanceType<Constructor>,
  fn: ControllerMethod,
  context: Context,
  globalInterceptors: NestUseInterceptors,
  next: Next,
) {
  const interceptors = await getInterceptors(target, fn, globalInterceptors);
  if (interceptors.length > 0) {
    return compose(interceptors)(context, next);
  } else {
    return next();
  }
}

/** Compose multiple middleware functions into a single middleware function. */
export function compose(interceptors: NestInterceptor[]) {
  return function composedInterceptors(
    context: Context,
    next?: Next,
  ) {
    let index = -1;

    async function dispatch(i: number): Promise<any> {
      if (i <= index) {
        throw new Error("next() called multiple times.");
      }
      index = i;
      const interceptor = interceptors[i];
      if (!interceptor) {
        if (next && i === interceptors.length) {
          return next();
        }
        return;
      }
      return await interceptor.intercept(context, dispatch.bind(null, i + 1));
    }

    return dispatch(0);
  };
}
