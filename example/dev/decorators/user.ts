import { type Context, createParamDecorator } from "@nest/core";

export const UserId = createParamDecorator((ctx: Context) => {
  return ctx.request.states.userId;
});
