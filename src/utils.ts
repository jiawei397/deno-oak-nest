// deno-lint-ignore-file no-explicit-any
import { Reflect } from "../deps.ts";
import { Constructor, InjectedData } from "./interface.ts";

export const META_METHOD_KEY = Symbol("meta:method");
export const META_PATH_KEY = Symbol("meta:path");

export const Controller = (path: string): ClassDecorator => {
  return (target) => {
    Reflect.defineMetadata(META_PATH_KEY, path, target);
  };
};

export enum Methods {
  GET = "get",
  POST = "post",
  PUT = "put",
  DELETE = "delete",
  HEAD = "head",
}

const createMappingDecorator = (method: Methods) =>
  (path: string): MethodDecorator => {
    return (_target, _property, descriptor) => {
      Reflect.defineMetadata(META_PATH_KEY, path, descriptor.value);
      Reflect.defineMetadata(META_METHOD_KEY, method, descriptor.value);
    };
  };

export const Get = createMappingDecorator(Methods.GET);
export const Post = createMappingDecorator(Methods.POST);
export const Delete = createMappingDecorator(Methods.DELETE);
export const Put = createMappingDecorator(Methods.PUT);
export const Head = createMappingDecorator(Methods.HEAD);

export const Injectable = (): ClassDecorator => (_target) => {};

export const factory = new Map();

export const Factory = async <T>(target: Constructor<T>): Promise<T> => {
  const providers = Reflect.getMetadata("design:paramtypes", target);
  let args: any[] = [];
  if (providers?.length) {
    args = await Promise.all(
      providers.map((provider: Constructor, index: number) => {
        const injectedData = Reflect.getMetadata(
          "design:inject" + index,
          target,
        ) as InjectedData;
        if (typeof injectedData?.fn === "function") {
          return injectedData.fn.apply(null, injectedData.params);
        }
        return Factory(provider);
      }),
    );
  }
  if (factory.has(target)) {
    // console.debug("factory.has cache", target);
    return factory.get(target);
  }
  const instance = new target(...args);
  factory.set(target, instance);
  return instance;
};

export async function mapRoute(Cls: Constructor) {
  const instance = await Factory(Cls);
  const prototype = Object.getPrototypeOf(instance);
  return Object.getOwnPropertyNames(prototype)
    .map((item) => {
      if (item === "constructor") {
        return;
      }
      if (typeof prototype[item] !== "function") {
        return;
      }
      const fn = prototype[item];
      const route = Reflect.getMetadata(META_PATH_KEY, fn);
      if (!route) {
        return;
      }
      const method = Reflect.getMetadata(META_METHOD_KEY, fn);
      return {
        route,
        method,
        fn,
        item,
        instance,
        cls: Cls,
        methodName: item,
      };
    }).filter(Boolean);
}
