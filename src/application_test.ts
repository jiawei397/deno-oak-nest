// deno-lint-ignore-file no-unused-vars no-explicit-any
import { assert, assertEquals } from "../test_deps.ts";
import {
  collect,
  getRouterArr,
  join,
  mapRoute,
  replacePrefix,
  replacePrefixAndSuffix,
  replaceSuffix,
} from "./application.ts";
import { Controller, Get, Post } from "./decorators/controller.ts";
import type { CanActivate } from "./interfaces/guard.interface.ts";
import { UseGuards } from "./guard.ts";
import { Injectable } from "./decorators/inject.ts";
import {
  createMockApp,
  createMockContext,
  mockCallMethod,
} from "../tests/common_helper.ts";
import { type Context } from "./interfaces/context.interface.ts";
import { Status } from "../deps.ts";
import {
  BadRequestException,
  ForbiddenException,
  InternalServerErrorException,
  UnauthorizedException,
} from "./exceptions.ts";
import { ModuleType, OnModuleInit } from "./interfaces/module.interface.ts";
import { Module } from "./decorators/module.ts";
import {
  Provider,
  RegisteredProvider,
  SpecialProvider,
} from "./interfaces/provider.interface.ts";
import { Type } from "./interfaces/type.interface.ts";

Deno.test("join", () => {
  assertEquals(join(), "");
  assertEquals(join(""), "");
  assertEquals(join("/"), "");
  assertEquals(join("api"), "/api");
  assertEquals(join("/api"), "/api");
  assertEquals(join("/api/"), "/api");
  assertEquals(join("api/"), "/api");

  assertEquals(join("", "/api"), "/api");
  assertEquals(join("", "/api/"), "/api");
  assertEquals(join("", "api/"), "/api");

  assertEquals(join("/api", "/"), "/api");
  assertEquals(join("/api/", "/"), "/api");
  assertEquals(join("/api", "/user"), "/api/user");
  assertEquals(join("/api", "/user/"), "/api/user");
  assertEquals(join("/api", "user/"), "/api/user");

  assertEquals(join("/api", "user", "add"), "/api/user/add");
  assertEquals(join("/api", "/user", "add"), "/api/user/add");
  assertEquals(join("/api", "/user", "add/"), "/api/user/add");
  assertEquals(join("/api", "/user/", "add/"), "/api/user/add");
  assertEquals(join("/api", "/user/", "/add"), "/api/user/add");
  assertEquals(join("/api", "/user/", "/add/"), "/api/user/add");
});

Deno.test("replacePrefix", async (t) => {
  await t.step("no replace", () => {
    const str = "/v1/user";
    assertEquals(replacePrefix(str, "/api/"), str);
  });

  await t.step("replace empty prefix", () => {
    const str = "${prefix}/v1/user";
    assertEquals(replacePrefix(str, ""), "/v1/user");
  });

  await t.step("replace  prefix /", () => {
    const str = "${prefix}/v1/user";
    assertEquals(replacePrefix(str, "/"), "/v1/user");
  });

  await t.step("replace prefix", () => {
    const str = "${prefix}/v1/user";
    assertEquals(replacePrefix(str, "/api/"), "/api/v1/user");
  });

  await t.step("replace prefix2", () => {
    const str = "${prefix}/v1/user";
    assertEquals(replacePrefix(str, "api/"), "/api/v1/user");
  });

  await t.step("replace prefix3", () => {
    const str = "${prefix}/v1/user";
    assertEquals(replacePrefix(str, "api"), "/api/v1/user");
  });

  await t.step("replace prefix not ok", () => {
    const str = "${prefix2}/v1/user";
    assertEquals(replacePrefix(str, "api/"), "/" + str);
  });
});

Deno.test("replaceSuffix", async (t) => {
  await t.step("no replace", () => {
    const str = "/v1/user";
    assertEquals(replaceSuffix(str, "/api/"), str);
  });

  await t.step("replace suffix", () => {
    const str = "${suffix}/v1/user";
    assertEquals(replaceSuffix(str, "/api/"), "/api/v1/user");
  });

  await t.step("replace suffix2", () => {
    const str = "${suffix}/v1/user";
    assertEquals(replaceSuffix(str, "api/"), "/api/v1/user");
  });

  await t.step("replace suffix3", () => {
    const str = "${suffix}/v1/user";
    assertEquals(replaceSuffix(str, "api"), "/api/v1/user");
  });

  await t.step("replace suffix4", () => {
    const str = "/v1/user/${suffix}";
    assertEquals(replaceSuffix(str, "api"), "/v1/user/api");
  });

  await t.step("replace suffix5", () => {
    const str = "/v1/${suffix}/user";
    assertEquals(replaceSuffix(str, "api"), "/v1/api/user");
  });

  await t.step("replace suffix not ok", () => {
    const str = "${suffix2}/v1/user";
    assertEquals(replaceSuffix(str, "api/"), "/" + str);
  });
});

Deno.test("replacePrefixAndSuffix", async (t) => {
  await t.step("no replace", () => {
    const str = "/v1/user";
    assertEquals(replacePrefixAndSuffix(str, "/api/", "info"), str);
  });

  await t.step("replace suffix", () => {
    const str = "${suffix}/v1/user";
    assertEquals(replacePrefixAndSuffix(str, "/api/", "info"), "/info/v1/user");
  });

  await t.step("replace prefix", () => {
    const str = "${prefix}/v1/user";
    assertEquals(replacePrefixAndSuffix(str, "api/", "info"), "/api/v1/user");
  });

  await t.step("replace prefix and suffix", () => {
    const str = "${prefix}/v1/user/${suffix}";
    assertEquals(
      replacePrefixAndSuffix(str, "api", "info"),
      "/api/v1/user/info",
    );
  });
  await t.step("replace prefix and suffix2", () => {
    const str = "${prefix}/v1/user/${suffix}";
    assertEquals(
      replacePrefixAndSuffix(str, "/api", "/info"),
      "/api/v1/user/info",
    );
  });

  await t.step("replace prefix and suffix3", () => {
    const str = "${prefix}/v1/user/${suffix}";
    assertEquals(
      replacePrefixAndSuffix(str, "/api/", "/info/"),
      "/api/v1/user/info",
    );
  });

  await t.step("replace prefix suffix and controller", () => {
    const str = "${prefix}/v1/${controller}/${suffix}";
    assertEquals(
      replacePrefixAndSuffix(str, "/api/", "/info/", "user"),
      "/api/v1/user/info",
    );
  });

  await t.step("replace not ok", () => {
    const str = "${suffix2}/v1/user";
    assertEquals(replacePrefixAndSuffix(str, "/api/", "/info/"), "/" + str);
  });
});

Deno.test("mapRoute without controller route", async () => {
  class A {
    @Get("/a")
    method1() {}

    @Post("/b")
    method2() {}
  }

  const result = await mapRoute(A);
  assert(Array.isArray(result));
  assertEquals(result.length, 2);

  const map1 = result[0];
  assert(map1);
  assertEquals(map1.methodPath, "/a");
  assertEquals(map1.methodName, "method1");
  assertEquals(map1.methodType, "get");
  assert(map1.instance instanceof A);
  assertEquals(map1.cls, A);

  const map2 = result[1];
  assert(map2);
  assertEquals(map2.methodPath, "/b");
  assertEquals(map2.methodName, "method2");
  assertEquals(map2.methodType, "post");
  assert(map2.instance instanceof A);
  assertEquals(map2.cls, A);

  assertEquals(map1.instance, map2.instance, "instance should be same");
});

Deno.test("mapRoute with controller route", async () => {
  @Controller("/user")
  class A {
    @Get("/a")
    method1() {}

    @Post("/b")
    method2() {}
  }

  const result = await mapRoute(A);
  assert(Array.isArray(result));
  assertEquals(result.length, 2);

  result.forEach((item) => {
    assert(item);
    assert(
      !item.methodPath.startsWith("/user/"),
      'should not start with "/user/", this function not deal with controller route',
    );
  });
});

Deno.test("collect", async () => {
  const callStack: number[] = [];

  const moduleArr: ModuleType[] = [];
  const controllerArr: Type<any>[] = [];
  const registeredProviderArr: RegisteredProvider[] = [];
  const dynamicProviders: Provider[] = [];
  const specialProviders: SpecialProvider[] = [];

  const Controller = (): ClassDecorator => () => {};

  class ChildService {}

  @Controller()
  class ChildController {
    constructor(private readonly childService: ChildService) {}
  }

  @Module({
    imports: [],
    controllers: [
      ChildController,
    ],
  })
  class ChildModule {}

  class AppService {}

  class SchedulerService {
    onModuleInit() {
      callStack.push(1);
    }
  }

  @Controller()
  class AppController {
    constructor(private readonly appService: AppService) {}
  }

  @Module({
    imports: [ChildModule],
    controllers: [
      AppController,
    ],
    providers: [SchedulerService],
  })
  class AppModule {}

  await collect(
    AppModule,
    moduleArr,
    controllerArr,
    registeredProviderArr,
    dynamicProviders,
    specialProviders,
  );

  assertEquals(moduleArr.length, 2);
  assertEquals(controllerArr.length, 2);
  assertEquals(controllerArr[0], AppController);
  assertEquals(controllerArr[1], ChildController);

  assertEquals(registeredProviderArr.length, 1);
  assertEquals(registeredProviderArr[0], SchedulerService);

  assertEquals(dynamicProviders.length, 0);

  assertEquals(specialProviders.length, 0);
});

Deno.test("module init", async (t) => {
  const callStack: number[] = [];

  const Controller = (): ClassDecorator => () => {};
  const Injectable = (): ClassDecorator => () => {};

  @Injectable()
  class ChildService implements OnModuleInit {
    onModuleInit() {
      callStack.push(1);
    }
  }

  @Controller()
  class ChildController {
    constructor(private readonly childService: ChildService) {
    }

    onModuleInit() {
      callStack.push(2);
    }
  }

  @Injectable()
  class AppService {
    onModuleInit() {
      callStack.push(4);
    }
  }

  @Injectable()
  class SchedulerService {
    onModuleInit() {
      callStack.push(5);
    }
  }

  @Controller()
  class AppController {
    constructor(private readonly appService: AppService) {}
    onModuleInit() {
      callStack.push(6);
    }
  }

  await t.step("module without providers", async () => {
    @Module({
      imports: [],
      controllers: [
        ChildController,
      ],
    })
    class ChildModule {
      onModuleInit() {
        callStack.push(3);
      }
    }

    @Module({
      imports: [ChildModule],
      controllers: [
        AppController,
      ],
      providers: [SchedulerService],
    })
    class AppModule {}

    const app = createMockApp();
    await app.init(AppModule, new Map());

    assertEquals(
      callStack,
      [5, 6, 2, 3],
      "because no provider, so no call 1, 4",
    );

    callStack.length = 0;
  });

  await t.step("module with providers", async () => {
    @Module({
      imports: [],
      controllers: [
        ChildController,
      ],
      providers: [
        ChildService,
      ],
    })
    class ChildModule {
      onModuleInit() {
        callStack.push(3);
      }
    }

    @Module({
      imports: [ChildModule],
      controllers: [
        AppController,
      ],
      providers: [SchedulerService, AppService],
    })
    class AppModule {}

    const app = createMockApp();
    await app.init(AppModule, new Map());

    console.log("module inited", callStack);
    assertEquals(
      callStack,
      [5, 4, 1, 6, 2, 3],
    );

    callStack.length = 0;
  });
});

Deno.test("getRouterArr", async (t) => {
  class A {
    @Get("/a")
    method1() {}
  }

  await t.step("one Class", async () => {
    const result = await getRouterArr([A], new Map());
    assert(Array.isArray(result));
    assertEquals(result.length, 1);
    assert(result[0]);
    assertEquals(result[0].controllerPath, "");

    const arr = result[0].arr;
    assert(Array.isArray(arr));
    assertEquals(arr.length, 1);
    assertEquals(arr[0].methodPath, "/a");
    assertEquals(arr[0].methodName, "method1");
  });

  await t.step("multi Class", async () => {
    class B {
      @Get("/b")
      method2() {}

      @Get("/c")
      method3() {}
    }

    const result = await getRouterArr([A, B], new Map());
    assertEquals(result.length, 2, "should add new controller");
    assertEquals(result[1].arr.length, 2);
  });
});

Deno.test("routes check result", async (t) => {
  const app = createMockApp();

  @Controller("user")
  class A {
    @Get("/a")
    method1() {
      return "a";
    }

    @Get("/b")
    noReturn() {}

    @Get("/c")
    dealBodySelf(ctx: Context) {
      ctx.response.body = "c";
    }

    @Get("/d")
    error(ctx: Context) {
      ctx.response.status = 400;
      ctx.response.body = new Error("d");
    }

    @Get("/e")
    e() {
      throw Error("e error");
    }

    @Get("/f")
    f() {
      throw new BadRequestException("f exception");
    }
  }
  app.addController(A);

  await t.step("get a ", async () => {
    const ctx = createMockContext({
      path: "/user/a",
      method: "GET",
    });
    await mockCallMethod(app, ctx);

    assertEquals(ctx.response.body, "a");
  });

  await t.step("get b", async () => {
    const ctx = createMockContext({
      path: "/user/b",
      method: "GET",
    });
    await mockCallMethod(app, ctx);
    assertEquals(ctx.response.body, undefined);
  });

  await t.step("get c", async () => {
    const ctx = createMockContext({
      path: "/user/c",
      method: "GET",
    });
    await mockCallMethod(app, ctx);
    assertEquals(ctx.response.body, "c");
  });

  await t.step("get d", async () => {
    const ctx = createMockContext({
      path: "/user/d",
      method: "GET",
    });
    await mockCallMethod(app, ctx);
    assert(ctx.response.body instanceof Error);
    assertEquals(ctx.response.status, 400);
  });

  await t.step("throw error self", async () => {
    const ctx = createMockContext({
      path: "/user/e",
      method: "GET",
    });
    await mockCallMethod(app, ctx);

    assertEquals(ctx.response.status, 500);
    assertEquals(
      ctx.response.body,
      new InternalServerErrorException("e error").response,
    );
  });

  await t.step("throw exception self", async () => {
    const ctx = createMockContext({
      path: "/user/f",
      method: "GET",
    });
    await mockCallMethod(app, ctx);

    const exception = new BadRequestException("f exception");
    assertEquals(ctx.response.status, exception.status);
    assertEquals(
      ctx.response.body,
      exception.response,
    );
  });
});

Deno.test("routes with guard success", async () => {
  const app = createMockApp();

  class AuthGuard implements CanActivate {
    // deno-lint-ignore require-await
    async canActivate(_context: Context): Promise<boolean> {
      return true;
    }
  }

  const callStack: number[] = [];

  @UseGuards(AuthGuard)
  @Controller("user")
  class A {
    @Get("/a")
    method1() {
      callStack.push(1);
      return "a";
    }
  }
  app.addController(A);

  const ctx = createMockContext({
    path: "/user/a",
    method: "GET",
  });

  await mockCallMethod(app, ctx);

  assertEquals(ctx.response.body, "a");
  assertEquals(callStack, [1]);
});

Deno.test("routes with guard false", async (t) => {
  @Injectable()
  class AuthGuard implements CanActivate {
    // deno-lint-ignore require-await
    async canActivate(_context: Context): Promise<boolean> {
      return false;
    }
  }

  @Injectable()
  class AuthGuard2 implements CanActivate {
    // deno-lint-ignore require-await
    async canActivate(_context: Context): Promise<boolean> {
      throw new UnauthorizedException("");
    }
  }

  @Injectable()
  class AuthGuard3 implements CanActivate {
    // deno-lint-ignore require-await
    async canActivate(_context: Context): Promise<boolean> {
      throw new Error("AuthGuard3 error");
    }
  }

  const callStack: number[] = [];

  @Controller("")
  class A {
    @UseGuards(AuthGuard)
    @Get("/a")
    a() {
      callStack.push(1);
      return "a";
    }

    @UseGuards(AuthGuard2)
    @Get("/b")
    b() {
      callStack.push(2);
      return "b";
    }

    @UseGuards(AuthGuard3)
    @Get("/c")
    c() {
      callStack.push(3);
      return "c";
    }
  }
  const app = createMockApp();
  app.addController(A);

  await t.step("guard return false", async () => {
    const ctx = createMockContext({
      path: "/a",
      method: "GET",
    });
    await mockCallMethod(app, ctx);

    assertEquals(ctx.response.status, Status.Forbidden);
    assertEquals(ctx.response.body, new ForbiddenException("").response);
    assertEquals(callStack, []);
  });

  await t.step("guard throw Http Exception", async () => {
    const ctx = createMockContext({
      path: "/b",
      method: "GET",
    });
    await mockCallMethod(app, ctx);

    assertEquals(ctx.response.status, Status.Unauthorized);
    assertEquals(ctx.response.body, new UnauthorizedException("").response);
    assertEquals(callStack, []);
  });

  await t.step("guard throw Error", async () => {
    const ctx = createMockContext({
      path: "/c",
      method: "GET",
    });
    await mockCallMethod(app, ctx);

    assertEquals(ctx.response.status, Status.InternalServerError);
    assertEquals(
      ctx.response.body,
      new InternalServerErrorException("AuthGuard3 error").response,
    );
    assertEquals(callStack, []);
  });
});
