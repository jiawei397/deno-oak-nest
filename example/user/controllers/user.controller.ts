// deno-lint-ignore-file no-explicit-any require-await no-unused-vars
import {
  Body,
  CanActivate,
  // Context,
  Controller,
  ControllerName,
  Get,
  getMetadataForGuard,
  Ip,
  MethodName,
  Post,
  Query,
  Req,
  Request,
  Res,
  Response,
  SetMetadata,
  UseGuards,
} from "../../../mod.ts";
import type { Context } from "../../../mod.ts";
import { BadRequestException, delay, mockjs } from "../../deps.ts";

class AuthGuard implements CanActivate {
  async canActivate(context: Context): Promise<boolean> {
    console.log("--AuthGuard---");
    console.log("roles", getMetadataForGuard("roles", context));
    // await delay(100);
    // throw new ForbiddenException("this is AuthGuard error message");
    return true;
    // return false;
  }
}

class AuthGuard2 implements CanActivate {
  async canActivate(_context: Context): Promise<boolean> {
    console.log("--AuthGuard2---");
    // throw new ForbiddenException('this is AuthGuard2 error message');
    return true;
  }
}

class AuthGuard3 implements CanActivate {
  async canActivate(_context: Context): Promise<boolean> {
    console.log("--AuthGuard3---");
    this.test();
    // throw new ForbiddenException("this is AuthGuard3 error message");
    return true;
    // return false;
  }

  test() {
    console.log("---test");
  }
}

export enum RoleAction {
  read = 1,
  write = 1 << 1,
  delete = 1 << 2,
  export = 1 << 3,
}

export const Roles = (...roles: RoleAction[]) => SetMetadata("roles", roles);

export const LogTime = () => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;
    descriptor.value = async function (...args: any[]) {
      const start = Date.now();
      const result = await originalMethod.apply(this, args);
      console.info(
        target.constructor.name,
        `${propertyKey}, take up time: ${
          (Date.now() - start) /
          1000
        } s`,
      );
      return result;
    };
    return descriptor;
  };
};

@UseGuards(AuthGuard)
@Controller("/user")
export class UserController {
  @UseGuards(AuthGuard2, AuthGuard3)
  @Get("/info")
  info(
    context: Context,
    @MethodName() methodName: string,
    @ControllerName() controllerName: string,
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
  testResultIsUndefined(@Req() req: Request, @Ip() ip: string) {
    console.log(ip, req);
    return;
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

  /**
   * 上传文件
   */
  @Post("upload")
  async upload(ctx: Context) {
    const data = ctx.request.body({
      type: "form-data",
    });
    const result = await data.value.read();
    console.log("---upload----", result);
    ctx.response.body = "test ok";
  }
}
