import { Context, Reflect } from "../deps.ts";
import { ControllerMethod } from "./interface.ts";

const paramMetadataKey = Symbol('meta:param');

export const createParamDecorator = (callback: ControllerMethod) => {
    return (target: any, propertyKey: string | symbol, parameterIndex: number) => {
        Reflect.defineMetadata(
            paramMetadataKey,
            {
                parameterIndex,
                callback
            },
            target.constructor,
            propertyKey,
        );
    };
}

export async function transferParam(target: any, methodName: string, ctx: Context, args: any[]) {
    const addedParameters = Reflect.getOwnMetadata(
        paramMetadataKey,
        target.constructor,
        methodName,
    );
    if (addedParameters) {
        args[addedParameters.parameterIndex - 1] = await addedParameters.callback(ctx);
    }
}