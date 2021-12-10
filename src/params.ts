// deno-lint-ignore-file no-explicit-any
import { Reflect } from "../deps.ts";
import { ControllerMethod } from "./interfaces/mod.ts";

const paramMetadataKey = Symbol("meta:param");
const ctxMetadataKey = Symbol("meta:ctx");

/**
 * this is a high function which will return a param decorator.
 * @example const Body = createParamDecorator((ctx: Context) => {});
 */
export const createParamDecorator = (callback: ControllerMethod) => {
  return () =>
    (
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

/**
 * this is a lower function which compared with createParamDecorator, it remove one player.
 * @example const Headers = (params: any) => createParamDecoratorWithLowLevel((ctx: Context) => {});
 */
export const createParamDecoratorWithLowLevel = (
  callback: ControllerMethod,
) => {
  return createParamDecorator(callback)();
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
        args[index] = await callback(ctx, target, methodName, index);
      }),
    );
  }
}
