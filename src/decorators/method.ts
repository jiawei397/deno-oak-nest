// deno-lint-ignore-file no-explicit-any
import {
  assert,
  Reflect,
  validateOrReject,
  ValidationError,
} from "../../deps.ts";
import {
  createParamDecorator,
  createParamDecoratorWithLowLevel,
} from "../params.ts";
import type { Constructor } from "../interfaces/type.interface.ts";
import type {
  ArrayItemType,
  FormDataOptions,
} from "../interfaces/param.interface.ts";
import { Context, CookiesGetOptions } from "../interfaces/context.interface.ts";
import { parseSearchParams } from "../utils.ts";
import { BodyParamValidationException } from "../exceptions.ts";

const typePreKey = "nesttype:";

export function Property(arrayItemType?: ArrayItemType): PropertyDecorator {
  return (target: any, propertyKey: any) => {
    const designType = Reflect.getMetadata("design:type", target, propertyKey);
    const keyArr = [typePreKey, propertyKey];
    if (arrayItemType) {
      keyArr.push(arrayItemType);
    }
    Reflect.defineMetadata(keyArr.join("@"), designType, target);
  };
}

export async function validateParams(Cls: Constructor, value: object) {
  if (!Cls || Cls === Object) {
    // if no class validation, we can skip this
    return;
  }
  const post = new Cls();
  Object.assign(post, value);
  try {
    await validateOrReject(post);
  } catch (errors) {
    // console.debug(errors);
    const msgs: string[] = [];
    (errors as ValidationError[]).forEach((err) => {
      if (err.constraints) {
        Object.values(err.constraints).forEach((element) => {
          msgs.push(element);
        });
      }
    });
    assert(
      msgs.length > 0,
      `the msgs must be not empty and the validationErrors are ${
        JSON.stringify(
          errors,
        )
      }`,
    );
    throw new BodyParamValidationException(msgs.join(", "));
  }
}

export function Body(key?: string) {
  return createParamDecoratorWithLowLevel(
    async (ctx: Context, target: any, methodName: string, index: number) => {
      const request = ctx.request;
      const contentType = request.header("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new BodyParamValidationException("content-type must be json");
      }
      const value = await request.json();
      if (!value || typeof value !== "object") {
        throw new BodyParamValidationException("body must be json object");
      }
      const providers = Reflect.getMetadata(
        // get the params providers
        "design:paramtypes",
        target,
        methodName,
      );
      await validateParams(providers?.[index], value);
      if (key) {
        return value?.[key];
      }
      return value;
    },
  );
}

function parseNumOrBool(
  val: string | string[] | null | undefined,
  target: any,
  methodName: string,
  index: number,
) {
  if (val) {
    const providers = Reflect.getMetadata(
      // get the params providers
      "design:paramtypes",
      target,
      methodName,
    );
    if (providers?.[index]) {
      // cannot deal Array here, because cannot get the real type of every item.
      return getTransNumOrBoolOrArray(providers[index], val);
    }
  }
  return val;
}

function transAndValidateParams(
  target: any,
  methodName: string,
  index: number,
  map: Record<string, string | string[] | File>,
) {
  const providers = Reflect.getMetadata(
    // get the params providers
    "design:paramtypes",
    target,
    methodName,
  );
  if (!providers || !providers[index] || providers[index] === Object) {
    return map;
  }
  const cls = providers[index];
  return transAndValidateByCls(cls, map);
}

export function getTransNumOrBoolOrArray(
  type: Constructor,
  val: string | string[],
  arrayItemType?: ArrayItemType,
): boolean | number | string | (boolean | number | string)[] {
  if (type === Boolean) {
    return val === "true";
  }
  if (type === Number) {
    return Number(val);
  }
  const transArray = (arr: string[]) => {
    return arr.map((str) => {
      const result = str.trim();
      if (result && arrayItemType) {
        if (arrayItemType === "number") {
          return getTransNumOrBoolOrArray(Number, result) as number;
        } else if (arrayItemType === "boolean") {
          return getTransNumOrBoolOrArray(Boolean, result) as boolean;
        }
      }
      return result;
    });
  };
  if (Array.isArray(val)) {
    return transArray(val);
  }
  if (type === Array) {
    return transArray(val.split(","));
  }
  return val;
}

export async function transAndValidateByCls(
  cls: Constructor,
  map: Record<
    string,
    string | number | boolean | File | (string | number | boolean | File)[]
  >,
) {
  const keys = Reflect.getMetadataKeys(cls.prototype);
  keys.forEach((key) => {
    if (!key.startsWith(typePreKey)) {
      return;
    }
    const type = Reflect.getMetadata(key, cls.prototype);
    const arr = key.split("@");
    const realKey = arr.at(1);
    if (map[realKey] === undefined) {
      return;
    }
    map[realKey] = getTransNumOrBoolOrArray(
      type,
      map[realKey] as string,
      arr.at(2),
    );
  });
  await validateParams(cls, map);
  return map;
}

/**
 * get the params from the request, if has key, then return the value which is parse by it`s type
 * @example such as `http://localhost/api/users/1?name=tom`, then params is {name: tom}
 */
export function Query(key?: string) {
  return createParamDecoratorWithLowLevel(
    (ctx: Context, target: any, methodName: string, index: number) => {
      if (!key) {
        const url = ctx.request.url;
        const searchParams = new URL(url).searchParams;
        const map = parseSearchParams(searchParams);
        return transAndValidateParams(target, methodName, index, map);
      } else {
        const val = ctx.request.query(key);
        return parseNumOrBool(val, target, methodName, index);
      }
    },
  );
}

/**
 * Get params by router
 * @example such as `http://localhost:1000/api/role/info/114`， then params is {id: 114}
 */
export function Params(key?: string) {
  return createParamDecoratorWithLowLevel(
    (ctx: Context, target: any, methodName: string, index: number) => {
      if (!key) {
        const params = ctx.request.params();
        return transAndValidateParams(target, methodName, index, params);
      }
      return parseNumOrBool(ctx.request.param(key), target, methodName, index);
    },
  );
}

export function Headers(key?: string) {
  return createParamDecoratorWithLowLevel(
    (ctx: Context, target: any, methodName: string, index: number) => {
      if (key) {
        return parseNumOrBool(
          ctx.request.header(key),
          target,
          methodName,
          index,
        );
      }
      return ctx.request.headers();
    },
  );
}

export const Req = createParamDecorator((ctx: Context) => {
  return ctx.request;
});

export const Res = createParamDecorator((ctx: Context) => {
  return ctx.response;
});

export const Ip = createParamDecorator((ctx: Context) => {
  return (
    ctx.request.header("x-real-ip") || ctx.request.header("x-forwarded-for")
  );
});

export const Host = createParamDecorator((ctx: Context) => {
  return ctx.request.header("host");
});

export function Cookie(key: string, options?: CookiesGetOptions) {
  return createParamDecoratorWithLowLevel(
    async (ctx: Context, target: any, methodName: string, index: number) => {
      const val = await ctx.cookies.get(key, options);
      if (!val) {
        return val;
      }
      return parseNumOrBool(val, target, methodName, index);
    },
  );
}

export function Cookies() {
  return createParamDecoratorWithLowLevel(
    (ctx: Context) => {
      return ctx.cookies;
    },
  );
}

// export function Session() {
//   return createParamDecoratorWithLowLevel((ctx: IContext) => {
//     return ctx.request.session;
//   });
// }

export const MethodName = createParamDecorator(
  (_ctx: Context, _target: any, methodName: string) => {
    return methodName;
  },
);

export const ControllerName = createParamDecorator(
  (_ctx: Context, target: any) => {
    return target.constructor.name;
  },
);

export function Form(options: FormDataOptions = {}) {
  return createParamDecoratorWithLowLevel(
    async (ctx: Context, target: any, methodName: string, index: number) => {
      const result = await ctx.request.formData();
      // console.log(result);
      const fields: Record<string, any> = {};
      result.forEach((value, key) => {
        if (value instanceof File) {
          if (options.maxFileSize && value.size >= options.maxFileSize) {
            throw new BodyParamValidationException("file size too large");
          }
        }
        if (fields[key] === undefined) {
          fields[key] = value;
        } else {
          if (Array.isArray(fields[key])) {
            fields[key].push(value);
          } else {
            fields[key] = [fields[key], value];
          }
        }
      });

      try {
        await transAndValidateParams(target, methodName, index, fields);
      } catch (error) {
        if (!options.ignoreValidate) {
          throw error;
        }
      }
      return fields;
    },
  );
}
