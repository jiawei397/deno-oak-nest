# deno_nest

[![deno version](https://img.shields.io/badge/deno-^1.37.0-blue?logo=deno)](https://github.com/denoland/deno)
[![Deno](https://github.com/jiawei397/deno-oak-nest/actions/workflows/deno.yml/badge.svg)](https://github.com/jiawei397/deno-oak-nest/actions/workflows/deno.yml)
[![codecov](https://codecov.io/gh/jiawei397/deno-oak-nest/branch/master/graph/badge.svg?token=NKP41TU4SL)](https://codecov.io/gh/jiawei397/deno-oak-nest)

Rely on [oak@v12.6.1](https://deno.land/x/oak@v12.6.1/mod.ts) and
[hono@v3.8.1](https://deno.land/x/hono@v3.8.1/mod.ts) to simulate some
annotation functions of [NestJS](https://docs.nestjs.com/) which is a great
frame for Node.js.

I will update the `oak` or `Hono` version if need.

> The previous framework name was `oak_nest`, now renamed `deno_nest`.
>
> It is recommended to use `Hono` as the underlying layer because its
> performance is better.

## start

You can use CLI to init:

```bash
deno run --allow-env --allow-run --allow-net --allow-read --allow-write --import-map https://deno.land/x/deno_nest@v3.4.0/cli/import_map.json https://deno.land/x/deno_nest@v3.4.0/cli/main.ts
```

Or you can install CLI by:

```bash
deno install --allow-env --allow-run --allow-net --allow-read --allow-write --import-map https://deno.land/x/deno_nest@v3.4.0/cli/import_map.json  -n nest -f https://deno.land/x/deno_nest@v3.4.0/cli/main.ts
```

Then use as `nest` or `nest new`.

### config

If you not use CLI create project, then efore start your app, you may set
`deno.json` or `deno.jsonc` before:

```json
"compilerOptions": {
  "emitDecoratorMetadata": true,
  "strictPropertyInitialization": false
},
"imports": {
  "@nest": "https://deno.land/x/deno_nest@v3.4.0/mod.ts",
  "@nest/hono": "https://deno.land/x/deno_nest@v3.4.0/modules/hono/mod.ts",
  "@nest/oak": "https://deno.land/x/deno_nest@v3.4.0/modules/oak/mod.ts",
  "@nest/tests": "https://deno.land/x/deno_nest@v3.4.0/tests/mod.ts",
  "class_validator": "https://deno.land/x/deno_class_validator@v1.0.0/mod.ts"
}
```

The `@nest/hono` and `@nest/oak` only need one.

### run

You can see the current App by:

```bash
deno task dev
```

## Demo

### Controller

Decorators
`Module`、`Controller`、`Injectable`、`UseGuards`、`Get`、`Post`、`Body`、`Headers`、`Query`、`Res`、`Req`
now are available：

```ts
import {
  Body,
  type CanActivate,
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
} from "@nest";
import mockjs from "https://deno.land/x/deno_mock@v2.0.0/mod.ts";
import { delay } from "https://deno.land/std@0.194.0/async/mod.ts";

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
    @add() name: string,
    @Query() params: any,
    @Query("age") age: string,
  ) {
    console.log(params, age);
    return "role info " + name + " - " +
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
  @Headers() headers: Headers,
  @Headers("host") host: string,
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
validator, which is forked from `class-validator` which is using in Node.js, if
it fails, then will throw an `400` Error.

### Controller use Service

You can use `Injectable` to flag the service can be injectable, and it can be
used by your Controller or other Service.

```ts
import { Injectable } from "@nest";

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
  info() {
    return this.userService.info() + this.roleService.info();
  }
}
```

If you like to use the `Service` alone in anywhere, you can with `Factory` like
this:

```ts
import { Factory } from "@nest";
Factory(UserService).info();
```

## use Module

First is the AppModule:

```ts
import { Module } from "@nest";
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
import { Module } from "@nest";
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
import { Context, isHttpError, NestFactory, Status } from "@nest";
import { HonoRouter } from "@nest/hono";
import { AppModule } from "./app.module.ts";

const app = await NestFactory.create(AppModule, HonoRouter);
app.setGlobalPrefix("api");

// Timing
app.use(async (req, res, next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  res.headers.set("X-Response-Time", `${ms}ms`);
});

app.get("/", (_req, res) => {
  res.body = "Hello World!";
});

const port = Number(Deno.env.get("PORT") || 1000);
console.log(`app will start with: http://localhost:${port}`);
await app.listen({ port });
```

If you want to use `oak` instead of `Hono`, you can change like this:

```ts
import { OakRouter } from "@nest/oak";

const app = await NestFactory.create(AppModule, OakRouter);
```

### use static files

If you want to serve your own static files, you can use the following:

```typescript
app.useStaticAssets("example/static", {
  prefix: "static",
});
```

It must be used before the routes (`app.use(app.routes())`).

### connect db

If you want to connect db such as Mongodb, you can do like this:

```ts
import { Module } from "@nest";
import { MongoModule } from "@nest/mongo";
import { UserModule } from "./user/user.module.ts";

@Module({
  imports: [
    MongoModule.forRoot("mongodb://10.100.30.65:27018/test"),
    UserModule,
  ],
  controllers: [],
})
export class AppModule {}
```

And you may provide a method to inject your Model:

```ts
export const InjectModel = (Cls: Constructor) =>
(
  target: Constructor,
  _property: any,
  index: number,
) => {
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
import { Inject } from "@nest";
export const InjectModel = (Cls: Constructor) => Inject(() => getModel(Cls));
```

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

In the above code, `this.model` is the `getModel` result. More example see
`modules/mongo/example`.

### register Dynamic Module

You can also register a Dynamic Module like this:

```ts
import { DynamicModule, Module } from "@nest";
import { ASYNC_KEY } from "./async.constant.ts";
import { AsyncService } from "./async.service.ts";

@Module({})
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
import { Inject, Injectable } from "@nest";
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
[this way](https://deno.land/x/deno_nest@v3.4.0/modules/redis) or use the
modules such as `cache` and `scheduler` in the `modules` dir.

## use alias

If you want to manage your API with version, then you can use the alias.

### Controller alias

#### no prefix

Here is a controller file named `user.controller.ts`:

```typescript
@Controller("user", {
  alias: "/v1/user/",
})
export class UserController {
  @Get("/info")
  info() {
    return "info";
  }
}
```

Then you will have both API such as `/user/info` and `/v1/user/info`.

#### has global prefix

If you has setted global API prefix by this:

```typescript
const app = await NestFactory.create(AppModule);
app.setGlobalPrefix("/api");
```

Then you API is `/api/user/info` and `/v1/user/info`.

If you want your alias with prefix such as `/api/v1/user/info`, you can set
alias with template `${prefix}/`:

```typescript
@Controller("user", {
  alias: "${prefix}/v1/user/",
})
```

Similarly, you can set suffix like this:

```typescript
@Controller("user", {
  alias: "/v1/${suffix}",
})
```

Of course, you can set it at the same time:

```typescript
@Controller("user", {
  alias: "${prefix}/v1/${suffix}",
})
```

If you want your API not start with global prefix,then use the options
`isAbsolute`:

```typescript
@Controller("/v1/user", {
  isAbsolute: true,
})
```

### method alias

```typescript
@Controller("/user")
export class UserController {
  @Get("/info", {
    alias: "/v1/user/info",
  })
  info() {}
}
```

Then you will have both API `/user/info` and `/v1/user/info`.

#### template

The template `${prefix}` and `${suffix}` also work like above, and add
`${controller}`:

```typescript
@Controller("/user")
export class UserController {
  @Get("/info", {
    alias: "${prefix}/v3/${controller}/${suffix}",
  })
  info() {}
}
```

#### isAbsolute

`isAbsolute` also work to set a Special API such as:

```typescript
@Controller("/user")
export class UserController {
  @Get("/v2/user/info", {
    isAbsolute: true,
  })
  info() {}
}
```

Then get an API `/v2/user/info`.

You can also use template as same:

```typescript
@Controller("/user")
export class UserController {
  @Get("${prefix}/v2/${controller}/info", {
    isAbsolute: true,
  })
  info() {}
}
```

But if you set global prefix `/api`, this will get `/api/v2/user/info`.

#### global prefix exclude

If you not want to set `isAbsolute` in every Controller, you can set an RegExp
by exclude when you `setGlobalPrefix`.

```typescript
const app = await NestFactory.create(AppModule);
app.setGlobalPrefix("/api", {
  exclude: [/^\/?v\d{1,3}\//],
});
```

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
import { createTestingModule } from "@nest/tests";

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

- [x] support Guard
- [x] support Interceptor
- [x] support ExceptionFilter
- [x] unit test self
- [x] provide API to help unit
- [x] support oak
- [x] support hono
- [x] static assets
- [x] support lifecycle
- [x] Nest CLI
- [x] unit Hono and Oak self
- [ ] Nest Doc

---

> You can see more in the example dirs.
