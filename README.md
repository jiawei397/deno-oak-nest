# oak_nest

[![deno version](https://img.shields.io/badge/deno-^1.13.2-blue?logo=deno)](https://github.com/denoland/deno)
<a href="https://github.com/denosaurs/denon/blob/master/LICENSE">
<img alt="Denon License" src="https://img.shields.io/github/license/denosaurs/denon?logo=data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABwAAAAcCAYAAAEFCu8CAAAABGdBTUEAALGPC/xhBQAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAHKADAAQAAAABAAAAHAAAAABHddaYAAAC5UlEQVRIDd2WPWtVQRCGby5pVASLiGghQSxyG8Ui2KWwCfkH9olY2JneQkiR0oCIxH/gB+qVFDYBIWBAbAIRSbCRpLXwIxLiPT7vnNm9e87ZxJtUwYH3zO47Mzv7Mbv3tlo5KYriGtgAJ81OY1ENdG/YI4boFEOI911BXgY/pdtwGuAtXpvmB1tAXHDnUolE5urkPOQo6MqA3pXWmJJL4Bb4rQ7yEYfxsjnIF29NJIoNC6e5fxOL/qN+9KCz7AaLpN8zI415N2i2EptpGrkRIjGeAuvR6IY1hSFLFUOug9Ms2M7ZxIUNytm1mnME186sdI2BOCwAyQMg54ugzSmKmwbPwSbolKH+hbAtQdsOoF+BsF3anUVwBdiOWRidFZDKTTrKEAJTm3GVrGkHzw/uPZbyx7DNNLfB7KGmRsCcr+/gjaiPSpAOTyX9qG4L/XBDdWXDDf1M+wtQ5fwCOtcb4Dto6VpLmzByB6gqdHbTItGSJdAGqibJQhmRfCF7IN4beSF2G9CqnGXQrxofXU+EykllNeoczRgYytDKMubDIRK0g5MF8rE69cGu0u9nlUcqaUZ41W0qK2nGcSzr4D2wV9U9wxp1rnpxn8agXAOHMQ9cy9kbHM7ngY4gFb03TxrO/yfBUifTtXt78jCrjY/jgEFnMn45LuNWUtknuu7NSm7D3QEn3HbatV1Q2jvgIRf1sfODKQaeymxZoMLlTqsq1LF+HvaTqQOzEzUCfni0/eNIA+DfuE3KEtbsegckGmMktTXacnBHPVe687ugkpT+axCkkhBSyRSjWI2xf1KMMVmYiQdWksK9BEFiQoiYLIlvJA3/zeTzCejP0RbB6YPbhZuB+0pR3KcdX0LaJtju0ZgBL8Bd+sbz2QIaU2OfBX3BaQLsgZysQtrk0M8Sh1A0w3DyyYnGnAiZ4gqZ/TvI2A8OGd1YIbF7+F3P+B6dYpYdsJNZgrjO0UdOIhmom0nwL0pnfnzkL1803jAoKhvyAAAAAElFTkSuQmCC" />
</a>

Rely on [oak@v10.0.0](https://deno.land/x/oak@v10.0.0/mod.ts) to simulate some
annotation functions of [nestjs](https://docs.nestjs.com/) which is a frame for
nodejs.

I will update the oak version if need.

## run

```
deno run --allow-net --allow-env --allow-write --unstable --config tsconfig.json example/main.ts
```

or you can use [denon](https://deno.land/x/denon)：

```
denon dev
```

## Demo

### Controller

Decorators
`Controller`、`UseGuards`、`Get`、`Post`、`Body`、`Headers`、`Query`、`Res`、`Req` now
are available：

```ts
import {
  Body,
  Context,
  Controller,
  createParamDecorator,
  createParamDecoratorWithLowLevel,
  ForbiddenException,
  Get,
  Headers,
  Post,
  Query,
  Res,
  UseGuards,
} from "https://deno.land/x/oak_nest@v0.4.0/mod.ts";
import type { CanActivate } from "https://deno.land/x/oak_nest@v0.4.0/mod.ts";
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

You can customize the decorator by `createParamDecorator` or
`createParamDecoratorWithLowLevel`:

```ts
const Add = createParamDecorator(async (ctx: any) => {
  const result = ctx.request.body(); // content type automatically detected
  if (result.type === "json") {
    const value = await result.value; // an object of parsed JSON
    // console.log('value', value);
    return value.userId;
  }
});

function Add2(params: any) {
  return createParamDecoratorWithLowLevel(async (ctx: any) => {
    return params;
  });
}
```

Then use like this:

```ts
@Post("/info")
info(
  @Add() name: string,
  @Add2("name") name2: string,
  @Body() params: any,
  @Headers() headers: any,
  @Headers("host") host: any,
  @Res() res: Response,
) {
  console.log("ctx", name, name2, params, headers, host);
  res.body = "role info " + name + name2;
}
```

Or you can use class validator like this:

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
  @Body() params: Dto
) {
  console.log("ctx", params);
  return "role info " + name;
}
```

The `Body` decorator is using
[deno_class_validator](https://deno.land/x/deno_class_validator@v0.0.1) for
validator, which is forked from `class-validator` which is using in nodejs, if
it fails, then will throw an `400` Error.

### Controller use Service

You can use `Injectable` to flag the service can be injectable, and it can be
used by your Controller or other Service.

```ts
import { Injectable } from "https://deno.land/x/oak_nest@v0.4.0/mod.ts";

@Injectable()
export class RoleService {
  info() {
    return "info from RoleService";
  }
}

@Injectable()
export class UserService {
  constructor(
    private readonly roleService: RoleService,
  ) {}
  info() {
    return mockjs.mock({
      name: "@name",
      "age|1-100": 50,
      "val|0-2": 1,
      role: this.roleService.info(),
      user2: this.userService2.info(),
    });
  }
}

@Controller("user")
export class User2Controller {
  constructor(
    private readonly userService: UserService,
    private readonly roleService: RoleService,
  ) {
  }
  @Get("/user2")
  info(context: Context) {
    context.response.body = this.userService.info() + this.roleService.info();
  }
}
```

If you like to use the `Service` alone in anywhere, you can with `Factory` like
this:

```ts
import { Factory } from "https://deno.land/x/oak_nest@v0.4.0/mod.ts";
Factory(UserService).info();
```

### router add Controller

```ts
import { UserController } from "./user.controller.ts";
import { User2Controller } from "./user2.controller.ts";
import { RoleController } from "./role.controller.ts";
import { Router } from "https://deno.land/x/oak_nest@v0.4.0/mod.ts";

const router = new Router();
router.add(UserController);
router.setGlobalPrefix("api");
router.add(RoleController, User2Controller);
```

### use router in app

```ts
import {
  Application,
  isHttpError,
  send,
  Status,
} from "https://deno.land/x/oak_nest@v0.4.0/mod.ts";
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

now you can visit
`http://localhost:1000/api/user/info`,`http://localhost:1000/api/user/list`.

You can see more in the example dirs.
