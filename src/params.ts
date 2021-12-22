// deno-lint-ignore-file no-explicit-any
import { Context, Reflect } from "../deps.ts";
import { Instance } from "./interfaces/mod.ts";
import { ParamDecoratorCallback } from "./interfaces/param.interface.ts";

export const paramMetadataKey = Symbol("meta:param");

/**
 * this is a high function which will return a param decorator.
 * @example const Body = createParamDecorator((ctx: Context) => {});
 */
export const createParamDecorator = (callback: ParamDecoratorCallback) => {
  return () =>
    (
      target: Instance,
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
        Reflect.defineMetadata(
          paramMetadataKey,
          addedParameters,
          target.constructor,
          propertyKey,
        );
      }
      addedParameters[parameterIndex] = callback;
    };
};

/**
 * this is a lower function which compared with createParamDecorator, it remove one player.
 * @example const Headers = (params: any) => createParamDecoratorWithLowLevel((ctx: Context) => {});
 */
export const createParamDecoratorWithLowLevel = (
  callback: ParamDecoratorCallback,
) => {
  return createParamDecorator(callback)();
};

export async function transferParam(
  target: Instance,
  methodName: string,
  ctx: Context,
): Promise<any[]> {
  const paramtypes = Reflect.getMetadata(
    "design:paramtypes",
    target,
    methodName,
  );
  if (!paramtypes || paramtypes.length === 0) {
    return [];
  }
  const args = new Array(paramtypes.length).fill(ctx);
  const addedParameters = Reflect.getOwnMetadata(
    paramMetadataKey,
    target.constructor,
    methodName,
  );
  if (addedParameters) {
    await Promise.all(
      addedParameters.map(async (
        callback: ParamDecoratorCallback,
        index: number,
      ) => args[index] = await callback(ctx, target, methodName, index)),
    );
  }
  return args;
}
