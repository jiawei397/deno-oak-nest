import { type Context, createParamDecorator } from "@nest";

export const UserId = createParamDecorator((ctx: Context) => {
  return ctx.request.states.userId;
});
