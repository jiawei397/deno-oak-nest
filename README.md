# oak_nest

[![deno version](https://img.shields.io/badge/deno-^1.20.3-blue?logo=deno)](https://github.com/denoland/deno)
[![Deno](https://github.com/jiawei397/deno-oak-nest/actions/workflows/deno.yml/badge.svg)](https://github.com/jiawei397/deno-oak-nest/actions/workflows/deno.yml)
<a href="https://github.com/denosaurs/denon/blob/master/LICENSE">
<img alt="Denon License" src="https://img.shields.io/github/license/denosaurs/denon?logo=data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABwAAAAcCAYAAAEFCu8CAAAABGdBTUEAALGPC/xhBQAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAHKADAAQAAAABAAAAHAAAAABHddaYAAAC5UlEQVRIDd2WPWtVQRCGby5pVASLiGghQSxyG8Ui2KWwCfkH9olY2JneQkiR0oCIxH/gB+qVFDYBIWBAbAIRSbCRpLXwIxLiPT7vnNm9e87ZxJtUwYH3zO47Mzv7Mbv3tlo5KYriGtgAJ81OY1ENdG/YI4boFEOI911BXgY/pdtwGuAtXpvmB1tAXHDnUolE5urkPOQo6MqA3pXWmJJL4Bb4rQ7yEYfxsjnIF29NJIoNC6e5fxOL/qN+9KCz7AaLpN8zI415N2i2EptpGrkRIjGeAuvR6IY1hSFLFUOug9Ms2M7ZxIUNytm1mnME186sdI2BOCwAyQMg54ugzSmKmwbPwSbolKH+hbAtQdsOoF+BsF3anUVwBdiOWRidFZDKTTrKEAJTm3GVrGkHzw/uPZbyx7DNNLfB7KGmRsCcr+/gjaiPSpAOTyX9qG4L/XBDdWXDDf1M+wtQ5fwCOtcb4Dto6VpLmzByB6gqdHbTItGSJdAGqibJQhmRfCF7IN4beSF2G9CqnGXQrxofXU+EykllNeoczRgYytDKMubDIRK0g5MF8rE69cGu0u9nlUcqaUZ41W0qK2nGcSzr4D2wV9U9wxp1rnpxn8agXAOHMQ9cy9kbHM7ngY4gFb03TxrO/yfBUifTtXt78jCrjY/jgEFnMn45LuNWUtknuu7NSm7D3QEn3HbatV1Q2jvgIRf1sfODKQaeymxZoMLlTqsq1LF+HvaTqQOzEzUCfni0/eNIA+DfuE3KEtbsegckGmMktTXacnBHPVe687ugkpT+axCkkhBSyRSjWI2xf1KMMVmYiQdWksK9BEFiQoiYLIlvJA3/zeTzCejP0RbB6YPbhZuB+0pR3KcdX0LaJtju0ZgBL8Bd+sbz2QIaU2OfBX3BaQLsgZysQtrk0M8Sh1A0w3DyyYnGnAiZ4gqZ/TvI2A8OGd1YIbF7+F3P+B6dYpYdsJNZgrjO0UdOIhmom0nwL0pnfnzkL1803jAoKhvyAAAAAElFTkSuQmCC" />
</a>

Rely on [oak@v10.5.0](https://deno.land/x/oak@v10.5.0/mod.ts) to simulate some
annotation functions of [nestjs](https://docs.nestjs.com/) which is a frame for
nodejs.

I will update the `oak` version if need.

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
`Module`、`Controller`、`Injectable`、`UseGuards`、`Get`、`Post`、`Body`、`Headers`、`Query`、`Res`、`Req`
now are available：

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
} from "https://deno.land/x/oak_nest@v1.9.1/mod.ts";
import type { CanActivate } from "https://deno.land/x/oak_nest@v1.9.1/mod.ts";
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

You can also use `class validator` like this:

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
import { Injectable } from "https://deno.land/x/oak_nest@v1.9.1/mod.ts";

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
import { Factory } from "https://deno.land/x/oak_nest@v1.9.1/mod.ts";
Factory(UserService).info();
```

### router add Controller

```ts
import { UserController } from "./user.controller.ts";
import { User2Controller } from "./user2.controller.ts";
import { RoleController } from "./role.controller.ts";
import { Router } from "https://deno.land/x/oak_nest@v1.9.1/mod.ts";

const router = new Router();
await router.add(UserController);
router.setGlobalPrefix("api");
await router.add(RoleController, User2Controller);
```

> It should be noted that `router.add` has been modified to asynchronous by me.
> Of course, I now recommend the following way `use Module`.

### use router in app

```ts
import {
  Application,
  isHttpError,
  Router,
  send,
  Status,
} from "https://deno.land/x/oak_nest@v1.9.1/mod.ts";

const app = new Application();

// Timing
app.use(async (ctx, next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  ctx.response.headers.set("X-Response-Time", `${ms}ms`);
});

const router = new Router();
app.use(router.routes());

const port = Number(Deno.env.get("PORT") || 1000);
console.log(`app will start with: http://localhost:${port}`);
await app.listen({ port });
```

now you can visit
`http://localhost:1000/api/user/info`,`http://localhost:1000/api/user/list`.

## use Module

First is the AppModule:

```ts
import { Module } from "https://deno.land/x/oak_nest@v1.9.1/mod.ts";
import { AppController } from "./app.controller.ts";
import { UserModule } from "./user/user.module.ts";

@Module({
  imports: [
    UserModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
```

Then is `UserModule`, and the `providers` can contain the services which are not
used by controllers.

```ts
import { Module } from "https://deno.land/x/oak_nest@v1.9.1/mod.ts";
import { RoleController } from "./controllers/role.controller.ts";
import { UserController } from "./controllers/user.controller.ts";
import { User2Controller } from "./controllers/user2.controller.ts";
import { ScheduleService } from "./services/schedule.service.ts";

@Module({
  imports: [],
  controllers: [
    UserController,
    RoleController,
    User2Controller,
  ],
  providers: [
    ScheduleService,
  ],
})
export class UserModule {
}
```

Then this is your main.ts:

```ts
import {
  Context,
  isHttpError,
  NestFactory,
  Status,
} from "https://deno.land/x/oak_nest@v1.9.1/mod.ts";
import { AppModule } from "./app.module.ts";

const app = await NestFactory.create(AppModule);
app.setGlobalPrefix("api");

// Timing
app.use(async (ctx: Context, next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  ctx.response.headers.set("X-Response-Time", `${ms}ms`);
});

app.get("/hello", (ctx: Context) => {
  ctx.response.body = "hello";
});

app.use(app.routes());

const port = Number(Deno.env.get("PORT") || 1000);
console.log(`app will start with: http://localhost:${port}`);
await app.listen({ port });
```

### connect db

If you want to connect db such as Mongodb, you can do like this:

```ts
import { Module } from "https://deno.land/x/oak_nest@v1.9.1/mod.ts";
import { AppController } from "./app.controller.ts";
import { UserModule } from "./user/user.module.ts";

@Module({
  imports: [
    MongoFactory.forRoot(globals.db), // it can return a Promise
    UserModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
```

And you may provide a method to inject your Model:

```ts
export const InjectModel = (Cls: Constructor) =>
  (target: Constructor, _property: any, index: number) => {
    Reflect.defineMetadata("design:inject" + index, {
      params: [Cls],
      fn: getModel,
    }, target);
  };
```

The function `getModel` can return a new Model which will be used in `Service`.
It maybe like this:

```ts
async function getModel<T>(
  cls: SchemaCls,
): Promise<Model<T>> {
  // do some else
  return new cls();
}
```

You can also use the `Inject` decorator to help you:

```ts
import { Inject } from "https://deno.land/x/oak_nest@v1.9.1/mod.ts";
export const InjectModel = (Cls: Constructor) => Inject(() => getModel(Cls));
```

> To support it, I changed the `router.add` method to asynchronous. It was not a
> pleasant decision.

Here is a Service example:

```ts
@Injectable()
export class UserService {
  constructor(@InjectModel(User) private readonly model: Model<User>) {
  }
  async save(createUserDto: AddUserDto): Promise<string> {
    console.log(this.model);
    const id = await this.model.insertOne(createUserDto);
    console.log(id);
    return id.toString();
  }
}
```

In the above code, `this.model` is the `getModel` result.

### register Dynamic Module

You can also register a Dynamic Module like this:

```ts
import { DynamicModule } from "https://deno.land/x/oak_nest@v1.9.1/mod.ts";
import { ASYNC_KEY } from "./async.constant.ts";
import { AsyncService } from "./async.service.ts";

export class AsyncModule {
  static register(db: string): DynamicModule {
    return {
      module: AsyncModule,
      providers: [{
        provide: ASYNC_KEY,
        useFactory: () => { // can be async
          console.log("AsyncModule.register: ", db);
          return Promise.resolve(true);
        },
      }, AsyncService],
    };
  }
}
```

And the `AsyncService` like this:

```ts
import { Inject, Injectable } from "https://deno.land/x/oak_nest@v1.9.1/mod.ts";
import { ASYNC_KEY } from "./async.constant.ts";

@Injectable()
export class AsyncService {
  constructor(@Inject(ASYNC_KEY) private readonly connection: string) {
    console.log(
      "injected CONNECTION_ASYNC maybe true: ",
      this.connection,
      "----",
      connection,
    );
  }

  info() {
    return "info from AsyncService and the conecction is: " + this.connection;
  }
}
```

The `ASYNC_KEY` recommended use symbol like this:

```ts
export const ASYNC_KEY = Symbol("CONNECTION_ASYNC");
```

Then the `AsyncModule` can be use by other modules and the service can be
injected to other service.

```ts
@Module({
  imports: [
    UserModule,
    AsyncModule.register("localhost:4878"),
  ],
  controllers: [AppController],
})
export class AppModule {}
```

You can also see the `RedisModule` example
[this way](https://deno.land/x/oak_nest_redis_module) or use the modules such as
`cache` and `scheduler` in the `modules` dir.

## unit

If you want to test your application, you can use `createTestingModule` to help
use.

First, let us create Service B and C, create a Controller A.

```ts
@Injectable()
class B {
  findAll() {
    return "b";
  }
}

@Controller("")
class A {
  constructor(private readonly b: B) {}

  find() {
    return this.b.findAll();
  }
}
```

Then use `createTestingModule`:

```ts
import { createTestingModule } from "https://deno.land/x/oak_nest@v1.9.1/mod.ts";

Deno.test("test origin only with controller", async () => {
  const moduleRef = await createTestingModule({
    controllers: [A],
  })
    .compile();
  const a = await moduleRef.get(A);
  assert(a instanceof A);
  const b = await moduleRef.get(B);
  assert(b instanceof B);
  assert(a["b"] === b);
  assertEquals(a.find(), "b");
});

Deno.test("test origin with providers", async () => {
  const moduleRef = await createTestingModule({
    controllers: [A],
    providers: [B],
  })
    .compile();
  const a = await moduleRef.get(A);
  assert(a instanceof A);
  const b = await moduleRef.get(B);
  assert(b instanceof B);
  assert(a["b"] === b);
  assertEquals(a.find(), "b");
});

Deno.test("inject data by other object", async () => {
  const d = {
    findAll() {
      return "d";
    },
  };
  const moduleRef = await createTestingModule({
    controllers: [A],
  }).overrideProvider(B, d)
    .compile();
  const a = await moduleRef.get(A);
  assert(a instanceof A);
  const b = await moduleRef.get(B);
  assert(!(b instanceof B));
  assert(a["b"] === b);
  assert(b === d);
  assertEquals(a.find(), "d");
});

Deno.test("change provider self", async () => {
  const moduleRef = await createTestingModule({
    controllers: [A],
  })
    .compile();
  const a = await moduleRef.get(A);
  assert(a instanceof A);
  const b = await moduleRef.get(B);
  assert(b instanceof B);

  b.findAll = () => {
    return "bb";
  };

  assert(a["b"] === b);
  assertEquals(a.find(), "bb");
});

Deno.test("resolve will return not same", async () => {
  const moduleRef = await createTestingModule({
    controllers: [A],
  })
    .compile();
  const b = await moduleRef.get(B);
  assert(b instanceof B);
  const c = await moduleRef.resolve(B);
  assert(c instanceof B);
  assert(b !== c);

  const d = await moduleRef.resolve(B);
  assert(d !== c);
});
```

## TODO

- [x] unit test self
- [x] provide API to help unit

---

> You can see more in the example dirs.
