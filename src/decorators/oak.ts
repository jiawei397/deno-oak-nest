// deno-lint-ignore-file no-explicit-any
import {
  assert,
  BodyParamValidationException,
  parse,
  Reflect,
  validateOrReject,
  ValidationError,
} from "../../deps.ts";
import type { Context } from "../../deps.ts";
import {
  createParamDecorator,
  createParamDecoratorWithLowLevel,
} from "../params.ts";

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
      if (
        providers?.length && providers[index] && providers[index] !== Object
      ) { // if no class validation, we can skip this
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

/**
 * url后面拼接的参数获取
 */
export function Query(key?: string) {
  return createParamDecoratorWithLowLevel((ctx: Context) => {
    const { search } = ctx.request.url;
    if (search.startsWith("?")) {
      const map = parse(search.substr(1));
      if (key) {
        return map[key];
      }
      return map;
    }
    return key ? undefined : {};
  });
}

/**
 * 获取路由动态参数，比如http://localhost:1000/api/role/info/114，拿到114
 */
export function Params(key?: string) {
  return createParamDecoratorWithLowLevel((ctx: Context) => {
    const { params } = ctx as any;
    return key ? params[key] : params;
  });
}

export function Headers(key?: string) {
  return createParamDecoratorWithLowLevel((ctx: Context) => {
    if (key) {
      return ctx.request.headers.get(key);
    }
    return ctx.request.headers;
  });
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
  return createParamDecoratorWithLowLevel((ctx: Context) => {
    if (key) {
      return ctx.cookies.get(key);
    }
    return ctx.cookies;
  });
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
