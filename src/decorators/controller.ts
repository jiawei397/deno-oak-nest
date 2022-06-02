import { Reflect } from "../../deps.ts";
import { AliasOptions } from "../interfaces/controller.interface.ts";

export const META_METHOD_KEY = Symbol("meta:method");
export const META_PATH_KEY = Symbol("meta:path");
export const META_ALIAS_KEY = Symbol("meta:alias");
export const META_HTTP_CODE_KEY = Symbol("meta:http:code");
export const META_HEADER_KEY = Symbol("meta:header");

export const Controller = (
  path: string,
  options?: AliasOptions,
): ClassDecorator => {
  return (target) => {
    Reflect.defineMetadata(META_PATH_KEY, path, target);
    if (options) {
      Reflect.defineMetadata(META_ALIAS_KEY, options, target);
    }
  };
};

export enum Methods {
  GET = "get",
  POST = "post",
  PUT = "put",
  DELETE = "delete",
  HEAD = "head",
  PATCH = "patch",
  OPTIONS = "options",
}

const createMappingDecorator = (method: Methods) =>
  (path: string, options?: AliasOptions): MethodDecorator => {
    return (_target, _property, descriptor) => {
      Reflect.defineMetadata(META_PATH_KEY, path, descriptor.value);
      Reflect.defineMetadata(META_METHOD_KEY, method, descriptor.value);
      if (!options) {
        return;
      }
      Reflect.defineMetadata(META_ALIAS_KEY, options, descriptor.value);
    };
  };

export const Get = createMappingDecorator(Methods.GET);
export const Post = createMappingDecorator(Methods.POST);
export const Delete = createMappingDecorator(Methods.DELETE);
export const Put = createMappingDecorator(Methods.PUT);
export const Head = createMappingDecorator(Methods.HEAD);
export const Options = createMappingDecorator(Methods.OPTIONS);
export const Patch = createMappingDecorator(Methods.PATCH);

export function HttpCode(code: number): MethodDecorator {
  return (_target, _property, descriptor) => {
    Reflect.defineMetadata(META_HTTP_CODE_KEY, code, descriptor.value);
  };
}

export function Header(key: string, val: string): MethodDecorator {
  return (_target, _property, descriptor) => {
    const map = Reflect.getMetadata(META_HEADER_KEY, descriptor.value) || {};
    map[key] = val;
    Reflect.defineMetadata(META_HEADER_KEY, map, descriptor.value);
  };
}
