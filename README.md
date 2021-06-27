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

可使用注解`Controller`、`UseGuards`、`Get`、`Post`：

```ts
import {
  Controller,
  ForbiddenException,
  Get,
  Post,
  UseGuards,
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
  @Get("/info")
  info(context: Context) {
    context.response.body = mockjs.mock({
      name: "@name",
      "age|1-100": 50,
      "val|0-2": 1,
    });
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
