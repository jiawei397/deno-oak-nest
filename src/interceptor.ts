// deno-lint-ignore-file no-explicit-any
import { Context, Reflect } from "../deps.ts";
import { Factory } from "./factorys/class.factory.ts";
import { ControllerMethod } from "./interfaces/guard.interface.ts";
import { NestInterceptor } from "./interfaces/interceptor.interface.ts";
import { Constructor } from "./interfaces/type.interface.ts";
export const META_INTERCEPTOR_KEY = Symbol("meta:interceptor");

export function UseInterceptors(
  ...interceptors: NestInterceptor[]
): ClassDecorator | MethodDecorator {
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
): NestInterceptor[] {
  const classInterceptors = Reflect.getMetadata(META_INTERCEPTOR_KEY, target) ||
    [];
  const fnInterceptors = Reflect.getMetadata(META_INTERCEPTOR_KEY, fn) || [];
  return [...classInterceptors, ...fnInterceptors];
}

async function checkByInterceptors(
  target: InstanceType<Constructor>,
  fn: ControllerMethod,
  context: Context,
  methodName: keyof NestInterceptor,
) {
  const interceptors = getInterceptors(target, fn);
  if (interceptors.length > 0) {
    for (const interceptor of interceptors) {
      let _interceptor = interceptor;
      if (typeof interceptor === "function") {
        _interceptor = await Factory(interceptor);
      }
      const result = await _interceptor[methodName](context);
      if (result) {
        return result;
      }
    }
  }
}

export function checkPreByInterceptors(
  target: InstanceType<Constructor>,
  fn: ControllerMethod,
  context: Context,
) {
  return checkByInterceptors(target, fn, context, "pre");
}

export function checkPostByInterceptors(
  target: InstanceType<Constructor>,
  fn: ControllerMethod,
  context: Context,
) {
  return checkByInterceptors(target, fn, context, "post");
}
