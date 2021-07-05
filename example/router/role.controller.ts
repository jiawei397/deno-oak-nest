import {
  Body,
  Controller,
  createParamDecorator,
  Get,
  Headers,
  Post,
  Query,
  Res,
} from "../../mod.ts";
import { Context, Response } from "../deps.ts";

function Add() {
  return createParamDecorator(async (ctx: any) => {
    const result = ctx.request.body(); // content type automatically detected
    if (result.type === "json") {
      const value = await result.value; // an object of parsed JSON
      // console.log('value', value);
      return value.userId;
    }
    return ctx.params.id;
  });
}

@Controller("/role")
export class RoleController {
  @Get("/info/:id")
  test(
    context: Context,
    @add() name: string,
    @Query() params: any,
    @Query("age") age: string,
  ) {
    console.log(params, age);
    context.response.body = "role info " + name + " - " +
      JSON.stringify(params);
  }

  @Get("/info")
  getInfo(@Res() res: Response, @Query() params: any) {
    console.log(params);
    res.body = "role get info " + JSON.stringify(params);
  }

  @Post("/info")
  info(
    @Add() name: string,
    @Body() params: any,
    @Headers() headers: any,
    @Headers("host") host: any,
    @Res() res: Response,
  ) {
    console.log("ctx", name, params, headers, host);
    res.body = "role info " + name;
  }
}
