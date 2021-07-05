import { Body, Controller, createParamDecorator, Get, Post } from "../../mod.ts";
import { Context } from "../deps.ts";

function add() {
  return createParamDecorator(async (ctx: any) => {
    const result = ctx.request.body(); // content type automatically detected
    if (result.type === "json") {
      const value = await result.value; // an object of parsed JSON
      // console.log('value', value);
      return value.userId;
    }
    return ctx.params.id;
  })
}

@Controller("/role")
export class RoleController {
  @Get("/info/:id")
  test(context: Context, @add() name: string) {
    context.response.body = "role info " + name;
  }

  @Post("/info")
  info(context: Context, @add() name: string, @Body() params: any) {
    console.log('ctx', name, params);
    context.response.body = "role info " + name;
  }
}
