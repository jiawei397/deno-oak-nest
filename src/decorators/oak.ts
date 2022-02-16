// deno-lint-ignore-file no-explicit-any
import {
  assert,
  BodyParamValidationException,
  FormDataReadOptions,
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
      if (providers?.[index] && providers[index] !== Object) { // if no class validation, we can skip this
        const post = new providers[index]();
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
      return value;
    }
  },
);

function parseNumOrBool(
  val: unknown,
  target: any,
  methodName: string,
  index: number,
) {
  if (val !== undefined && val !== null) {
    const providers = Reflect.getMetadata( // get the params providers
      "design:paramtypes",
      target,
      methodName,
    );
    if (providers?.[index]) {
      const type = providers[index];
      if (type === Boolean) {
        return val === "true";
      }
      if (type === Number) {
        return Number(val);
      }
    }
  }
  return val;
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
        return map;
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
        return params;
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

export function UploadedFile(options: FormDataReadOptions = {}) {
  return createParamDecoratorWithLowLevel((ctx: Context) => {
    const data = ctx.request.body({
      type: "form-data",
    });
    if (data?.value) {
      return data.value.read(options);
    }
  });
}
