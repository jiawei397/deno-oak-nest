import { Reflect } from "../../deps.ts";

export const META_METHOD_KEY = Symbol("meta:method");
export const META_PATH_KEY = Symbol("meta:path");
export const META_ALIAS_KEY = Symbol("meta:alias");
export const META_ISABSOLUTE_KEY = Symbol("meta:isAbsolute");

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
  PATCH = "patch",
  OPTIONS = "options",
}

const createMappingDecorator = (method: Methods) =>
  (path: string, options?: {
    alias?: string;
    isAbsolute?: boolean;
  }): MethodDecorator => {
    return (_target, _property, descriptor) => {
      Reflect.defineMetadata(META_PATH_KEY, path, descriptor.value);
      Reflect.defineMetadata(META_METHOD_KEY, method, descriptor.value);
      if (!options) {
        return;
      }
      if (options.alias) {
        Reflect.defineMetadata(META_ALIAS_KEY, options.alias, descriptor.value);
      }
      if (options.isAbsolute) {
        Reflect.defineMetadata(
          META_ISABSOLUTE_KEY,
          options.isAbsolute,
          descriptor.value,
        );
      }
    };
  };

export const Get = createMappingDecorator(Methods.GET);
export const Post = createMappingDecorator(Methods.POST);
export const Delete = createMappingDecorator(Methods.DELETE);
export const Put = createMappingDecorator(Methods.PUT);
export const Head = createMappingDecorator(Methods.HEAD);
export const Options = createMappingDecorator(Methods.OPTIONS);
export const Patch = createMappingDecorator(Methods.PATCH);
