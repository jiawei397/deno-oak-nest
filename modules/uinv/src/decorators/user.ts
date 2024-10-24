import type { ParamDecoratorResult } from "@nest/core";
import { type Context, createParamDecorator } from "../../deps.ts";

export const UserParam: ParamDecoratorResult = createParamDecorator(
  (ctx: Context) => {
    return ctx.request.states.userInfo;
  },
);
