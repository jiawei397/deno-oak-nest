import { createParamDecorator } from "../../mod.ts";

// deno-lint-ignore no-explicit-any
export const Add = createParamDecorator(async (ctx: any) => {
  const result = ctx.request.body(); // content type automatically detected
  if (result.type === "json") {
    const value = await result.value; // an object of parsed JSON
    // console.log('value', value);
    return value.userId;
  }
  return ctx.params.id;
});
