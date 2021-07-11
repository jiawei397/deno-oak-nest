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
import { Context, Max, Min, Response } from "../deps.ts";

const Add = createParamDecorator(async (ctx: any) => {
  const result = ctx.request.body(); // content type automatically detected
  if (result.type === "json") {
    const value = await result.value; // an object of parsed JSON
    // console.log('value', value);
    return value.userId;
  }
  return ctx.params.id;
});

export class Dto {
  @Max(2)
  @Min(1)
  pageNum!: number;

  @Max(5)
  @Min(1)
  pageCount!: number;
}

@Controller("/role")
export class RoleController {
  @Get("/info/:id")
  test(
    context: Context,
    @Add() name: string,
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
    @Body(Dto) params: Dto,
    @Headers() headers: any,
    @Headers("host") host: any,
    @Res() res: Response,
  ) {
    console.log("ctx", name, params, headers, host);
    // res.body = "role info old " + name;
    return "role info " + name;
  }
}
