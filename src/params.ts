import { Context, Reflect } from "../deps.ts";
import { ControllerMethod } from "./interface.ts";

const paramMetadataKey = Symbol('meta:param');

export const createParamDecorator = (callback: ControllerMethod) => {
    return (target: any, propertyKey: string | symbol, parameterIndex: number) => {
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
}

export async function transferParam(target: any, methodName: string, ctx: Context, args: any[]) {
    const addedParameters = Reflect.getOwnMetadata(
        paramMetadataKey,
        target.constructor,
        methodName,
    );
    if (addedParameters) {
        await Promise.all(addedParameters.map(async (callback: ControllerMethod, index: number) => {
            args[index - 1] = await callback(ctx); // 这里-1考虑不要第一个参数
        }))
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
        return (ctx as any).params;
    });
}

export function Headers() {
    return createParamDecorator((ctx: Context) => {
        return ctx.request.headers;
    });
}