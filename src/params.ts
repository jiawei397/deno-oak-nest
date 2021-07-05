import { Context, parse, Reflect } from "../deps.ts";
import { ControllerMethod } from "./interface.ts";

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
      }),
    );
  }
}

export function Body() {
  return createParamDecorator(async (ctx: Context) => {
    const result = ctx.request.body(); // content type automatically detected
    if (result.type === "json") {
      const value = await result.value; // an object of parsed JSON
      // console.log('value', value);
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
