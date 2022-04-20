// deno-lint-ignore-file no-explicit-any
import {
  assert,
  BodyParamValidationException,
  Reflect,
  validateOrReject,
  ValidationError,
} from "../../deps.ts";
import type { Context } from "../../deps.ts";
import {
  createParamDecorator,
  createParamDecoratorWithLowLevel,
} from "../params.ts";
import { parseSearch } from "../utils.ts";
import { Constructor } from "../interfaces/type.interface.ts";
import {
  FormDataFormattedBody,
  FormDataOptions,
} from "../interfaces/param.interface.ts";

const typePreKey = "oaktype:";

export function Property(): PropertyDecorator {
  return (target: any, propertyKey: any) => {
    const type = Reflect.getMetadata("design:type", target, propertyKey);
    Reflect.defineMetadata(typePreKey + propertyKey, type, target);
  };
}

// deno-lint-ignore ban-types
export async function validateParams(Cls: Constructor, value: object) {
  if (!Cls || Cls === Object) { // if no class validation, we can skip this
    return;
  }
  const post = new Cls();
  Object.assign(post, value);
  try {
    await validateOrReject(post);
  } catch (errors) {
    // console.debug(errors);
    const msgs: string[] = [];
    errors.forEach((err: ValidationError) => {
      if (err.constraints) {
        Object.values(err.constraints).forEach((element) => {
          msgs.push(element);
        });
      }
    });
    assert(
      msgs.length > 0,
      `the msgs must be not empty and the validationErrors are ${
        JSON.stringify(errors)
      }`,
    );
    throw new BodyParamValidationException(msgs.join(","));
  }
}

export const Body = createParamDecorator(
  async (ctx: Context, target: any, methodName: string, index: number) => {
    const result = ctx.request.body(); // content type automatically detected
    if (result.type === "json") {
      const value = await result.value; // an object of parsed JSON
      const providers = Reflect.getMetadata( // get the params providers
        "design:paramtypes",
        target,
        methodName,
      );
      await validateParams(providers?.[index], value);
      return value;
    }
  },
);

function parseNumOrBool(
  val: string | null | undefined,
  target: any,
  methodName: string,
  index: number,
) {
  if (val) {
    const providers = Reflect.getMetadata( // get the params providers
      "design:paramtypes",
      target,
      methodName,
    );
    if (providers?.[index]) {
      // cannot deal Array here, because cannot get the real type of every item.
      return getTransNumOrBool(providers[index], val);
    }
  }
  return val;
}

function transAndValidateParams(
  target: any,
  methodName: string,
  index: number,
  map: Record<string, string>,
) {
  const providers = Reflect.getMetadata( // get the params providers
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

export function getTransNumOrBool(type: Constructor, val: string) {
  if (type === Boolean) {
    return val === "true";
  }
  if (type === Number) {
    return Number(val);
  }
  return val;
}

async function transAndValidateByCls(
  cls: Constructor,
  map: Record<string, string | number | boolean>,
) {
  const keys = Reflect.getMetadataKeys(cls.prototype);
  let isNeedValidate = false;
  keys.forEach((key) => {
    if (!key.startsWith(typePreKey)) {
      return;
    }
    const type = Reflect.getMetadata(key, cls.prototype);
    const realKey = key.replace(typePreKey, "");
    if (map[realKey] === undefined) {
      return;
    }
    isNeedValidate = true;
    map[realKey] = getTransNumOrBool(
      type,
      map[realKey] as string,
    );
  });
  if (isNeedValidate) { // if not use Property to translate the params, then we can skip this
    await validateParams(cls, map);
  }
  return map;
}

/**
 * get the params from the request, if has key, then return the value which is parse by it`s type
 * @example such as `http://localhost/api/users/1?name=tom`, then params is {name: tom}
 */
export function Query(key?: string) {
  return createParamDecoratorWithLowLevel(
    (ctx: Context, target: any, methodName: string, index: number) => {
      const { search } = ctx.request.url;
      const map = parseSearch(search);
      if (!key) {
        return transAndValidateParams(target, methodName, index, map);
      }
      return parseNumOrBool(map[key], target, methodName, index);
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
      const { params } = ctx as any;
      if (!key) {
        return transAndValidateParams(target, methodName, index, params);
      }
      return parseNumOrBool(params[key], target, methodName, index);
    },
  );
}

export function Headers(key?: string) {
  return createParamDecoratorWithLowLevel(
    (ctx: Context, target: any, methodName: string, index: number) => {
      if (key) {
        return parseNumOrBool(
          ctx.request.headers.get(key),
          target,
          methodName,
          index,
        );
      }
      return ctx.request.headers;
    },
  );
}

export const Header = Headers;

export const Req = createParamDecorator((ctx: Context) => {
  return ctx.request;
});

export const Res = createParamDecorator((ctx: Context) => {
  return ctx.response;
});

export const Ip = createParamDecorator((ctx: Context) => {
  const headers = ctx.request.headers;
  return headers.get("x-real-ip") || headers.get("x-forwarded-for");
});

export const Host = createParamDecorator((ctx: Context) => {
  return ctx.request.headers.get("host");
});

export function Cookies(key?: string) {
  return createParamDecoratorWithLowLevel(
    async (ctx: Context, target: any, methodName: string, index: number) => {
      if (key) {
        return parseNumOrBool(
          await ctx.cookies.get(key),
          target,
          methodName,
          index,
        );
      }
      return ctx.cookies;
    },
  );
}

export const Cookie = Cookies;

// export function Session() {
//   return createParamDecoratorWithLowLevel((ctx: Context) => {
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

export function UploadedFile(options: FormDataOptions = {}) {
  return createParamDecoratorWithLowLevel(
    async (ctx: Context) => {
      const data = ctx.request.body({
        type: "form-data",
      });
      const result = await data.value.read(options);
      if (options.validateCls) {
        await transAndValidateByCls(
          options.validateCls,
          result.fields,
        );
        return result as FormDataFormattedBody<typeof options.validateCls>;
      }
      return result;
    },
  );
}

export function Form() {
  return createParamDecoratorWithLowLevel(
    async (ctx: Context, target: any, methodName: string, index: number) => {
      const data = ctx.request.body({
        type: "form",
      });
      const result = await data.value;
      const map: Record<string, string> = {};
      result.forEach((value, key) => {
        map[key] = value;
      });
      return transAndValidateParams(target, methodName, index, map);
    },
  );
}
