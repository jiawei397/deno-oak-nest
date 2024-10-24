import { type Context, createParamDecorator } from "@nest/core";

export interface UserInfo {
  id: string;
  name: string;
  age: number;
}

export const User = createParamDecorator((ctx: Context) => {
  return ctx.request.states.userInfo;
});
