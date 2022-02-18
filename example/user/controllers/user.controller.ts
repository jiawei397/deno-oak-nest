// deno-lint-ignore-file no-explicit-any
import {
  Body,
  Controller,
  ControllerName,
  Get,
  Ip,
  MethodName,
  Post,
  Query,
  Res,
  Response,
  UploadedFile,
  UseGuards,
} from "../../../mod.ts";
import type { Context } from "../../../mod.ts";
import { BadRequestException, mockjs } from "../../deps.ts";
import { AuthGuard } from "../../guards/auth.guard.ts";
import { AuthGuard2 } from "../../guards/auth2.guard.ts";
import { AuthGuard3, SSOGuard } from "../../guards/auth3.guard.ts";
import { RoleAction, Roles } from "../../decorators/roles.ts";
import { LogTime } from "../../decorators/time.ts";
import { LoggerService } from "../services/logger.service.ts";

@UseGuards(AuthGuard, SSOGuard)
@Controller("/user")
export class UserController {
  constructor(private readonly loggerService: LoggerService) {
    this.loggerService.info("user");
  }

  @UseGuards(AuthGuard2, AuthGuard3)
  @Get("/info")
  info(
    @MethodName() methodName: string,
    @ControllerName() controllerName: string,
    context: Context,
  ) {
    console.log("methodName", methodName, "controllerName", controllerName);
    context.response.body = mockjs.mock({
      name: "@name",
      "age|1-100": 50,
      "val|0-2": 1,
    });
  }

  @Get("/info2")
  @UseGuards(AuthGuard2, AuthGuard3)
  info2(@Res() res: Response, @Query() params: any) {
    res.body = mockjs.mock({
      name: "@name",
      "age|1-100": 50,
      "val|0-2": 1,
      params,
    });
  }

  @Get("/test")
  testResultIsUndefined(@Ip() ip: string) {
    console.log(ip);
    return;
  }

  @Get("/304")
  test304() {
    return "test 304 ok";
  }

  @Get("/err")
  err() {
    throw new BadRequestException("bad request");
  }

  @UseGuards(AuthGuard2, AuthGuard3)
  @Get("list")
  @Roles(RoleAction.read)
  list(context: Context) {
    this.testInnerCall();
    context.response.body = mockjs.mock({
      "citys|100": [{ name: "@city", "value|1-100": 50, "type|0-2": 1 }],
    });
  }

  testInnerCall() {
    console.log("---testInnerCall---");
  }

  @Post("citys")
  @Roles(RoleAction.read, RoleAction.write)
  @LogTime()
  getCitys(ctx: Context, @Body() params: any) {
    console.log("----citys---", params);
    const result = mockjs.mock({
      "citys|100": [{ name: "@city", "value|1-100": 50, "type|0-2": 1 }],
    });
    // console.log(result);
    ctx.response.body = result;
  }

  @Post("upload")
  async upload(ctx: Context) {
    const data = ctx.request.body({
      type: "form-data",
    });
    const result = await data.value.read({
      maxFileSize: 10 * 1024 * 1024 * 1024,
    });
    console.log("---upload----", result);
    ctx.response.body = "test ok";
  }

  @Post("upload2")
  upload2(
    @UploadedFile({
      maxFileSize: 10 * 1024 * 1024 * 1024,
    }) result: any,
    @Res() res: Response,
  ) {
    console.log("---upload----", result);
    res.body = result;
  }
}
