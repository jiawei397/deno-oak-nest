// deno-lint-ignore-file no-explicit-any
import {
  Body,
  Controller,
  createParamDecorator,
  Get,
  Headers,
  Post,
  Query,
  Res,
  Response,
} from "../../../mod.ts";
import type { Context } from "../../../mod.ts";
import { Max, Min } from "../../deps.ts";
import { RoleService } from "../services/role.service.ts";

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
  constructor(private readonly roleService: RoleService) {
  }
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
    res.body = "role get info " + JSON.stringify(params) + " - " +
      this.roleService.info();
  }

  @Post("/info")
  info(
    @Add() name: string,
    @Body() params: Dto,
    @Headers() headers: any,
    @Headers("host") host: any,
  ) {
    console.log("ctx", name, params, headers, host);
    // res.body = "role info old " + name;
    return "role info " + name;
  }
}
