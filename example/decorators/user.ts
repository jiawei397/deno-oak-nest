import { type Context, createParamDecorator } from "../../mod.ts";

export const UserId = createParamDecorator((ctx: Context) => {
  return ctx.request.states.userId;
});
