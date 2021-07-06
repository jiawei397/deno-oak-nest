# 依赖oak，模拟nestjs部分注解功能

## 运行样例

```
deno run --allow-net  --allow-env  example/main.ts
```

或者使用denon：

```
denon dev
```

## Demo

### Controller

可使用注解`Controller`、`UseGuards`、`Get`、`Post`、`Body`、`Headers`、`Query`、`Res`、`Req`：

```ts
import {
  Controller,
  ForbiddenException,
  Get,
  Post,
  UseGuards,
  Body,
  createParamDecorator,
  Headers,
  Query,
  Res,
} from "https://deno.land/x/oak_nest/mod.ts";
import type { CanActivate } from "https://deno.land/x/oak_nest/mod.ts";
import { Context } from "https://deno.land/x/oak/mod.ts";
import mockjs from "https://deno.land/x/deno_mock@v2.0.0/mod.ts";
import { delay } from "https://deno.land/std/async/mod.ts";

class AuthGuard implements CanActivate {
  async canActivate(context: Context): Promise<boolean> {
    console.log("--AuthGuard---");
    await delay(100);
    // throw new ForbiddenException('这是AuthGuard错误信息');
    return true;
  }
}

class AuthGuard2 implements CanActivate {
  async canActivate(context: Context): Promise<boolean> {
    console.log("--AuthGuard2---");
    return true;
  }
}

class AuthGuard3 implements CanActivate {
  async canActivate(context: Context): Promise<boolean> {
    throw new ForbiddenException("这是AuthGuard3错误信息");
    return false;
  }
}

@UseGuards(AuthGuard)
@Controller("/user")
export class UserController {
  @UseGuards(AuthGuard2, AuthGuard3)
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

  @Get("list")
  list(context: Context) {
    console.log("---list----");
    this.testInnerCall();
    context.response.body = "list";
  }

  testInnerCall() {
    console.log("---test---");
  }
}
```

可以自定义注解：
```ts
function Add() {
  return createParamDecorator(async (ctx: any) => {
    const result = ctx.request.body(); // content type automatically detected
    if (result.type === "json") {
      const value = await result.value; // an object of parsed JSON
      // console.log('value', value);
      return value.userId;
    }
  });
}
```
然后使用：
```ts
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
```

也可以添加类型校验：
```ts
class Dto {
  @Max(2)
  @Min(1)
  pageNum!: number;

  @Max(5)
  @Min(1)
  pageCount!: number;
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
  return "role info " + name;
}
```
使用[deno_class_validator](https://deno.land/x/deno_class_validator@v0.0.1)进行校验，如果失败了，会抛出异常。

暂时没有做到nestjs那样直接拿到Dto的类型，所以现在不得不在Body多传一个参数，如果大家有好的方法，请给个建议。

### router注册Controller

```ts
import { UserController } from "./user.controller.ts";
import { Router } from "https://deno.land/x/oak_nest/mod.ts";

const router = new Router();
router.add(UserController);
router.setGlobalPrefix("api");
```

### 在app中使用router

```ts
import {
  Application,
  isHttpError,
  send,
  Status,
} from "https://deno.land/x/oak/mod.ts";
import router from "./router/index.ts";

const app = new Application();

// Timing
app.use(async (ctx, next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  ctx.response.headers.set("X-Response-Time", `${ms}ms`);
});

app.use(router.routes());

const port = Number(Deno.env.get("PORT") || 1000);
console.log(`app will start with: http://localhost:${port}`);
await app.listen({ port });
```

这时，你可以访问`http://localhost:1000/api/user/info`,`http://localhost:1000/api/user/list`。
