import { assert, assertEquals } from "../test_deps.ts";
import { Controller, Get } from "./decorators/controller.ts";
import type { CanActivate } from "./interfaces/guard.interface.ts";
import { UseGuards } from "./guard.ts";
import { Inject, Injectable } from "./decorators/inject.ts";
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
import { DynamicModule, OnModuleInit } from "./interfaces/module.interface.ts";
import { Module } from "./decorators/module.ts";

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
      [2, 5, 6, 3],
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

    assertEquals(
      callStack,
      [1, 2, 5, 4, 6, 3],
    );

    callStack.length = 0;
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

Deno.test("dynamic module", async (t) => {
  const callStack: number[] = [];
  const CONFIG_KEY = "CONFIG";
  const injectedValue = "injectedValue";

  @Injectable()
  class AsyncService {
    constructor(@Inject(CONFIG_KEY) private readonly key: string) {
      callStack.push(1);
    }

    get() {
      return this.key;
    }
  }

  await t.step("module normal use", async () => {
    @Controller("")
    class AppController {
      constructor(private readonly asyncService: AsyncService) {
        callStack.push(2);
        assertEquals(this.asyncService.get(), injectedValue);
      }
    }

    @Module({})
    class AsyncModule {
      static register(): DynamicModule {
        return {
          module: AsyncModule,
          providers: [
            {
              provide: CONFIG_KEY,
              useFactory: () => {
                return injectedValue;
              },
            },
            AsyncService,
          ],
          exports: [AsyncService],
          // global: true,
        };
      }
    }

    @Module({
      imports: [AsyncModule.register()],
      controllers: [
        AppController,
      ],
      providers: [],
    })
    class AppModule {}

    const app = createMockApp();
    await app.init(AppModule, new Map());

    assertEquals(callStack, [1, 2]);

    callStack.length = 0;
  });

  await t.step("module without exports not work well", async () => {
    @Controller("")
    class AppController {
      constructor(private readonly asyncService: AsyncService) {
        callStack.push(2);
        assertEquals(
          this.asyncService.get(),
          undefined,
          "not well inject data",
        );
      }
    }

    @Module({})
    class AsyncModule {
      static register(): DynamicModule {
        return {
          module: AsyncModule,
          providers: [
            {
              provide: CONFIG_KEY,
              useFactory: () => {
                return injectedValue;
              },
            },
            AsyncService,
          ],
        };
      }
    }

    @Module({
      imports: [AsyncModule.register()],
      controllers: [
        AppController,
      ],
      providers: [],
    })
    class AppModule {}

    const app = createMockApp();
    await app.init(AppModule, new Map());

    assertEquals(callStack, [1, 1, 2]);

    callStack.length = 0;
  });

  await t.step("another module use dynamic module", async (it) => {
    @Module({})
    class DyncModule {
      static register(): DynamicModule {
        return {
          module: DyncModule,
          providers: [
            {
              provide: CONFIG_KEY,
              useValue: injectedValue,
            },
            AsyncService,
          ],
          exports: [AsyncService],
        };
      }
    }

    await it.step("normal work", async () => {
      @Controller("cats")
      class CatsController {
        constructor(private readonly asyncService: AsyncService) {
          callStack.push(3);
          assertEquals(this.asyncService.get(), injectedValue);
        }
      }

      @Module({
        imports: [DyncModule],
        controllers: [CatsController],
        providers: [],
      })
      class CatsModule {}

      @Controller("")
      class AppController {
        constructor(private readonly asyncService: AsyncService) {
          callStack.push(2);
          assertEquals(this.asyncService.get(), injectedValue);
        }
      }

      @Module({
        imports: [DyncModule.register(), CatsModule],
        controllers: [
          AppController,
        ],
        providers: [],
      })
      class AppModule {}

      const app = createMockApp();
      await app.init(AppModule, new Map());

      assertEquals(callStack, [1, 3, 2]);

      callStack.length = 0;
    });

    await it.step("not work when not import DyncModule in CatsModule", async () => {
      @Controller("")
      class AppController {
        constructor(private readonly asyncService: AsyncService) {
          callStack.push(2);
          assertEquals(this.asyncService.get(), injectedValue);
        }
      }

      @Controller("cats")
      class CatsController {
        constructor(private readonly asyncService: AsyncService) {
          callStack.push(4);
          assertEquals(
            this.asyncService.get(),
            undefined,
            "this asyncService is different with the normal one",
          );
        }
      }

      @Module({
        imports: [],
        controllers: [CatsController],
        providers: [],
      })
      class CatsModule {}

      @Module({
        imports: [DyncModule.register(), CatsModule],
        controllers: [
          AppController,
        ],
        providers: [],
      })
      class AppModule {}

      const app = createMockApp();
      await app.init(AppModule, new Map());

      assertEquals(callStack, [1, 1, 4, 2]);

      callStack.length = 0;
    });
  });

  await t.step("module global set true", async (it) => {
    @Module({})
    class DyncModule {
      static register(): DynamicModule {
        return {
          module: DyncModule,
          providers: [
            {
              provide: CONFIG_KEY,
              useFactory: () => {
                return injectedValue;
              },
            },
            AsyncService,
          ],
          exports: [AsyncService],
          global: true,
        };
      }
    }

    await it.step("not work when DyncModule set to global", async () => {
      @Controller("cats")
      class CatsController {
        constructor(private readonly asyncService: AsyncService) {
          callStack.push(4);
          assertEquals(
            this.asyncService.get(),
            injectedValue,
          );
        }
      }

      @Module({
        imports: [],
        controllers: [CatsController],
        providers: [],
      })
      class CatsModule {}

      @Controller("")
      class AppController {
        constructor(private readonly asyncService: AsyncService) {
          callStack.push(2);
          assertEquals(this.asyncService.get(), injectedValue);
        }
      }

      @Module({
        imports: [DyncModule.register(), CatsModule],
        controllers: [
          AppController,
        ],
        providers: [],
      })
      class AppModule {}

      const app = createMockApp();
      await app.init(AppModule, new Map());

      assertEquals(callStack, [1, 4, 2]);

      callStack.length = 0;
    });
  });
});
