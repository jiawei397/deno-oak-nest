import {
  CanActivate,
  Controller,
  ForbiddenException,
  Get,
  Post,
  UseGuards,
} from "../../mod.ts";
import { Context, delay, mockjs } from "../deps.ts";

class AuthGuard implements CanActivate {
  async canActivate(context: Context): Promise<boolean> {
    console.log("--AuthGuard---");
    await delay(100);
    // throw new ForbiddenException('这是AuthGuard错误信息');
    return true;
    // return false;
  }
}

class AuthGuard2 implements CanActivate {
  async canActivate(context: Context): Promise<boolean> {
    console.log("--AuthGuard2---");
    // throw new ForbiddenException('这是AuthGuard2错误信息');
    return true;
  }
}

class AuthGuard3 implements CanActivate {
  async canActivate(context: Context): Promise<boolean> {
    // console.log(context.request.headers);
    // throw new Error('这是我抛出的错误测试');
    throw new ForbiddenException("这是AuthGuard3错误信息");
    // return true;
    // return false;
  }
}

@UseGuards(AuthGuard)
@Controller("/user")
export class UserController {
  // @UseGuards(AuthGuard2, AuthGuard3)
  @Get("/info")
  info(context: Context) {
    context.response.body = mockjs.mock({
      name: "@name",
      "age|1-100": 50,
      "val|0-2": 1,
    });
  }

  // @UseGuards(AuthGuard2, AuthGuard3)
  @Get("list")
  list(context: Context) {
    this.testInnerCall();
    context.response.body = mockjs.mock({
      "citys|100": [{ name: "@city", "value|1-100": 50, "type|0-2": 1 }],
    });
  }

  testInnerCall() {
    console.log("---test---");
  }

  @Post("citys")
  getCitys(ctx: Context) {
    console.log("----citys---");
    const result = mockjs.mock({
      "citys|100": [{ name: "@city", "value|1-100": 50, "type|0-2": 1 }],
    });
    console.log(result);
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
