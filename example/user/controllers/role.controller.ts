// deno-lint-ignore-file no-explicit-any
import {
  Body,
  Controller,
  Get,
  Headers,
  Post,
  Query,
  Res,
  Response,
} from "../../../mod.ts";
import type { Context } from "../../../mod.ts";
import { RoleService } from "../services/role.service.ts";
import { Add } from "../../decorators/add.ts";
import { RoleInfoDto } from "../dtos/role.dto.ts";
import { AsyncService } from "../../asyncModule/async.service.ts";

@Controller("/role")
export class RoleController {
  constructor(
    private readonly roleService: RoleService,
    private readonly asyncService: AsyncService,
  ) {
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
      this.roleService.info() + "-\n" + this.asyncService.info();
  }

  @Post("/info")
  info(
    @Add() name: string,
    @Body() params: RoleInfoDto,
    @Headers() headers: any,
    @Headers("host") host: any,
  ) {
    console.log("ctx", name, params, headers, host);
    // res.body = "role info old " + name;
    return "role info " + name;
  }
}
