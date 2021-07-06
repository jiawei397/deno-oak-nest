# oak_nest

Rely on [oak](https://deno.land/x/oak) to simulate some annotation functions of [nestjs](https://docs.nestjs.com/) which is a frame for nodejs

## examples

```
deno run --allow-net --allow-env --allow-write example/main.ts
```

or you can use [denon](https://deno.land/x/denon)：

```
denon dev
```

## Demo

### Controller

Decorators `Controller`、`UseGuards`、`Get`、`Post`、`Body`、`Headers`、`Query`、`Res`、`Req` now are available：

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
    // throw new ForbiddenException('this is AuthGuard error');
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
    throw new ForbiddenException("this is AuthGuard3 error");
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

You can customize the decorator by `createParamDecorator`: 
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
then use like this:
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

or you can use class validator like this:
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
it is use [deno_class_validator](https://deno.land/x/deno_class_validator@v0.0.1) for validator, if it fails, then will throw an Error.

I cannot get the type of dto directly like nestjs did, so now you have to pass one more parameter in the body. If you have a good idea, please give me a suggestion, then I will thanks much.

### router add Controller

```ts
import { UserController } from "./user.controller.ts";
import { Router } from "https://deno.land/x/oak_nest/mod.ts";

const router = new Router();
router.add(UserController);
router.setGlobalPrefix("api");
```

### use router in app

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

now you can visit `http://localhost:1000/api/user/info`,`http://localhost:1000/api/user/list`.
