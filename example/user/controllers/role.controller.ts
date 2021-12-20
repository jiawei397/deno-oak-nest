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
  UseInterceptors,
} from "../../../mod.ts";
import type { Context } from "../../../mod.ts";
import { RoleService } from "../services/role.service.ts";
import { Add } from "../../decorators/add.ts";
import { RoleInfoDto } from "../dtos/role.dto.ts";
import { AsyncService } from "../../asyncModule/async.service.ts";
// import { LoggingInterceptor } from "../../interceptor/log.interceptor.ts";
import { TransformInterceptor } from "../../interceptor/transform.interceptor.ts";
import { ErrorsInterceptor } from "../../interceptor/errors.interceptor.ts";
import { CacheInterceptor } from "../../../modules/cache/mod.ts";

@Controller("/role")
@UseInterceptors(CacheInterceptor)
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
  async getInfo(@Res() res: Response, @Query() params: any) {
    console.log("params is ", params);
    res.body = "role get info " + JSON.stringify(params) + " - " +
      await this.roleService.info() + "-\n" + this.asyncService.info();
  }

  @Get("/testInterceptor")
  @UseInterceptors(TransformInterceptor)
  testInterceptor(@Query() params: any) {
    console.log("params is ", params);
    return "role testInterceptor " + JSON.stringify(params);
  }

  @Get("/testErrorInterceptor")
  @UseInterceptors(ErrorsInterceptor)
  testErrorInterceptor() {
    throw new Error("testErrorInterceptor");
  }

  @Get("/delay")
  delay(@Query("id") id: string) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve("delay " + id);
      }, 1000);
    });
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
