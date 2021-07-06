import {
  assert,
  Context,
  parse,
  Reflect,
  validateOrReject,
  ValidationError,
} from "../deps.ts";
import { BodyParamValidationException } from "./exception.ts";
import { Constructor, ControllerMethod } from "./interface.ts";

const paramMetadataKey = Symbol("meta:param");
const ctxMetadataKey = Symbol("meta:ctx");

export const createParamDecorator = (callback: ControllerMethod) => {
  return (
    target: any,
    propertyKey: string | symbol,
    parameterIndex: number,
  ) => {
    let addedParameters = Reflect.getOwnMetadata(
      paramMetadataKey,
      target.constructor,
      propertyKey,
    );
    if (!addedParameters) {
      addedParameters = [];
    }
    addedParameters[parameterIndex] = callback;

    Reflect.defineMetadata(
      paramMetadataKey,
      addedParameters,
      target.constructor,
      propertyKey,
    );
  };
};

export async function transferParam(
  target: any,
  methodName: string,
  args: any[],
) {
  const addedParameters = Reflect.getOwnMetadata(
    paramMetadataKey,
    target.constructor,
    methodName,
  );
  let ctx = Reflect.getOwnMetadata(
    paramMetadataKey,
    target.constructor,
    ctxMetadataKey,
  );
  if (addedParameters) {
    await Promise.all(
      addedParameters.map(async (callback: ControllerMethod, index: number) => {
        if (!ctx) {
          ctx = args[0]; // first time, we must get the origin ctx
          Reflect.defineMetadata(
            paramMetadataKey,
            addedParameters,
            target.constructor,
            ctx,
          );
        }
        args[index] = await callback(ctx);
        // if (index == 1) {
        //   console.log(
        //     "params",
        //     index,
        //     args[index],
        //     args[index].constructor.name,
        //   );
        // }
      }),
    );
  }
}

export function Body(Cls?: Constructor) {
  return createParamDecorator(async (ctx: Context) => {
    const result = ctx.request.body(); // content type automatically detected
    if (result.type === "json") {
      const value = await result.value; // an object of parsed JSON
      // console.log('value', value);
      if (Cls) {
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

      return value;
    }
  });
}

/**
 * url后面拼接的参数获取
 */
export function Query(key?: string) {
  return createParamDecorator((ctx: Context) => {
    const { search } = ctx.request.url;
    if (search.startsWith("?")) {
      const map = parse(search.substr(1));
      if (key) {
        return map[key];
      }
      return map;
    }
    return {};
  });
}

/**
 * 获取路由动态参数，比如http://localhost:1000/api/role/info/114，拿到114
 */
export function Params(key?: string) {
  return createParamDecorator((ctx: Context) => {
    const { params } = ctx as any;
    return key ? params[key] : params;
  });
}

export function Headers(key?: string) {
  return createParamDecorator((ctx: Context) => {
    if (key) {
      return ctx.request.headers.get(key);
    }
    return ctx.request.headers;
  });
}

export const Header = Headers;

export function Req() {
  return createParamDecorator((ctx: Context) => {
    return ctx.request;
  });
}

export function Res() {
  return createParamDecorator((ctx: Context) => {
    return ctx.response;
  });
}
// export function Session() {
//   return createParamDecorator((ctx: Context) => {
//     return ctx.request.session;
//   });
// }
