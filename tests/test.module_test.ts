// deno-lint-ignore-file no-unused-vars require-await no-explicit-any
import { Controller, Get } from "../src/decorators/controller.ts";
import { Injectable } from "../src/decorators/inject.ts";
import { assert, assertEquals } from "./test_deps.ts";
import { createTestingModule } from "./test.module.ts";
import type { CanActivate } from "../src/interfaces/guard.interface.ts";
import type { Context } from "../src/interfaces/context.interface.ts";
import { UseGuards } from "../src/guard.ts";
import type { ExceptionFilter } from "../src/interfaces/filter.interface.ts";
import { Catch, UseFilters } from "../src/filter.ts";
import { Scope } from "../src/interfaces/scope-options.interface.ts";
import type { NestInterceptor } from "../src/interfaces/interceptor.interface.ts";
import type { Next } from "../src/interfaces/middleware.interface.ts";
import type { APP_INTERCEPTOR } from "../src/constants.ts";
import { UseInterceptors } from "../src/interceptor.ts";
import type { DynamicModule } from "../src/interfaces/module.interface.ts";
import { Module } from "../src/decorators/module.ts";

@Injectable()
class B {
  findAll() {
    return "b";
  }
}

@Injectable()
class C {
}

@Controller("")
class A {
  constructor(private readonly b: B, private readonly c: C) {}

  @Get("")
  find() {
    return this.b.findAll();
  }
}

Deno.test("test origin only with controller", async (t) => {
  const moduleRef = await createTestingModule({
    controllers: [A],
    // providers: [B],
  })
    .compile();

  await t.step("test origin", async () => {
    const a = await moduleRef.get(A);
    assert(a instanceof A);
    const b = await moduleRef.get(B);
    assert(b instanceof B);
    assert(a["b"] === b);
    assertEquals(a.find(), "b");

    class C {}
    const c = await moduleRef.get(C);
    assertEquals(c, null);
  });

  await t.step("test parent", async () => {
    const parent = class {};
    const a = await moduleRef.get(A, parent);
    assertEquals(a, null);
  });

  await t.step("test parent with provider", async () => {
    @Injectable({
      scope: Scope.TRANSIENT,
    })
    class LoggerService {}

    @Controller("")
    class A {
      constructor(private loggerService: LoggerService) {}
    }

    @Controller("")
    class B {
      constructor(private loggerService: LoggerService) {}
    }

    const moduleRef = await createTestingModule({
      controllers: [A, B],
    }).compile();
    const loggerService = await moduleRef.get(LoggerService, A);
    const loggerService2 = await moduleRef.get(LoggerService, B);

    assert(loggerService);
    assert(loggerService2);
    assert(loggerService instanceof LoggerService);
    assert(loggerService2 instanceof LoggerService);
    assert(loggerService !== loggerService2, "service is not singleton");

    const a = await moduleRef.get(A);
    const b = await moduleRef.get(B);
    assert(a instanceof A);
    assert(b instanceof B);
    assert(a["loggerService"] === loggerService);
    assert(b["loggerService"] === loggerService2);

    const c = class {};
    const res = await moduleRef.get(c, A);
    assertEquals(res, null);
  });
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

Deno.test("overrideProvider", async (t) => {
  const d = {
    findAll() {
      return "d";
    },
  };
  await t.step("override provider success", async () => {
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

  await t.step("provider alone", async () => {
    const moduleRef = await createTestingModule({
      providers: [B],
    }).overrideProvider(B, d)
      .compile();
    const b = await moduleRef.get(B);
    assert(b === d);
  });
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

Deno.test(
  "e2e test",
  { sanitizeOps: false, sanitizeResources: false },
  async () => {
    const moduleRef = await createTestingModule({
      controllers: [A],
      // providers: [B],
    })
      .compile();
    const app = moduleRef.createNestApplication();
    await app.init();

    const res = await fetch(`http://localhost:${app.port}/`);
    assertEquals(res.status, 200);
    assertEquals(await res.text(), "b");

    await app.close();
  },
);

Deno.test(
  "override guard",
  { sanitizeOps: false, sanitizeResources: false },
  async (t) => {
    const callStack: number[] = [];

    @Injectable()
    class AuthGuard implements CanActivate {
      async canActivate(_context: Context): Promise<boolean> {
        callStack.push(1);
        return true;
      }
    }

    @Controller("")
    @UseGuards(AuthGuard)
    class TestController {
      @Get("/")
      a() {
        callStack.push(2);
        return "a";
      }
    }

    await t.step(
      "test origin",
      async () => {
        const moduleRef = await createTestingModule({
          controllers: [TestController],
        }).compile();
        const app = moduleRef.createNestApplication();
        await app.init();

        const res = await fetch(`http://localhost:${app.port}/`);
        assertEquals(res.status, 200);
        assertEquals(await res.text(), "a");
        assertEquals(callStack, [1, 2]);

        callStack.length = 0;

        await app.close();
      },
    );

    await t.step("override guard", async () => {
      @Injectable()
      class AuthGuard2 implements CanActivate {
        async canActivate(_context: Context): Promise<boolean> {
          callStack.push(3);
          return false;
        }
      }

      const moduleRef = await createTestingModule({
        controllers: [TestController],
      }).overrideGuard(AuthGuard, AuthGuard2).compile();

      const app = moduleRef.createNestApplication();
      await app.init();

      const res = await fetch(`http://localhost:${app.port}/`);
      assertEquals(res.status, 403);
      res.body?.cancel();

      assertEquals(callStack, [3]);

      callStack.length = 0;

      await app.close();
    });

    await t.step("override guard with no controllers", async () => {
      @Injectable()
      class AuthGuard2 implements CanActivate {
        async canActivate(_context: Context): Promise<boolean> {
          return false;
        }
      }
      await createTestingModule({}).overrideGuard(
        AuthGuard,
        AuthGuard2,
      ).compile();

      assert(true, "no error");
    });
  },
);

Deno.test("override exception filter", {
  sanitizeOps: false,
  sanitizeResources: false,
}, async (t) => {
  const callStack: number[] = [];

  @Catch()
  class AnyExceptionFilter implements ExceptionFilter {
    catch(_exception: any, context: Context) {
      context.response.status = 400;
      callStack.push(1);
    }
  }

  @Controller("")
  @UseFilters(AnyExceptionFilter)
  class TestController {
    @Get("/")
    a() {
      callStack.push(2);
      throw new Error("test");
    }
  }

  await t.step("test origin", async () => {
    const moduleRef = await createTestingModule({
      controllers: [TestController],
    }).compile();
    const app = moduleRef.createNestApplication();
    await app.init();

    const res = await fetch(`http://localhost:${app.port}/`);
    assertEquals(res.status, 400);
    res.body?.cancel();

    assertEquals(callStack, [2, 1]);

    callStack.length = 0;

    await app.close();
  });

  await t.step("override exception filter", async () => {
    @Catch()
    class AnyExceptionFilter2 implements ExceptionFilter {
      catch(_exception: any, context: Context) {
        callStack.push(3);
        context.response.status = 405;
      }
    }

    const moduleRef = await createTestingModule({
      controllers: [TestController],
    }).overrideFilter(AnyExceptionFilter, AnyExceptionFilter2).compile();

    const app = moduleRef.createNestApplication();
    await app.init();

    const res = await fetch(`http://localhost:${app.port}/`);
    assertEquals(res.status, 405);
    res.body?.cancel();

    assertEquals(callStack, [2, 3]);

    callStack.length = 0;

    await app.close();
  });

  await t.step("override exception filter in method", async () => {
    @Controller("")
    class TestController {
      @UseFilters(AnyExceptionFilter)
      @Get("/")
      a() {
        callStack.push(2);
        throw new Error("test");
      }
    }

    @Catch()
    class AnyExceptionFilter2 implements ExceptionFilter {
      catch(_exception: any, context: Context) {
        callStack.push(3);
        context.response.status = 405;
      }
    }

    const moduleRef = await createTestingModule({
      controllers: [TestController],
    }).overrideFilter(AnyExceptionFilter, AnyExceptionFilter2).compile();

    const app = moduleRef.createNestApplication();
    await app.init();

    const res = await fetch(`http://localhost:${app.port}/`);
    assertEquals(res.status, 405);
    res.body?.cancel();

    assertEquals(callStack, [2, 3]);

    callStack.length = 0;

    await app.close();
  });
});

Deno.test("override interceptor", {
  sanitizeOps: false,
  sanitizeResources: false,
}, async (t) => {
  const callStack: number[] = [];

  @Injectable()
  class AnyInterceptor implements NestInterceptor {
    async intercept(_ctx: Context, next: Next) {
      callStack.push(1);
      await next();
      callStack.push(2);
    }
  }

  @Controller("")
  @UseInterceptors(AnyInterceptor)
  class TestController {
    @Get("/")
    a() {
      callStack.push(3);
      return "a";
    }
  }

  await t.step("test origin", async () => {
    const moduleRef = await createTestingModule({
      controllers: [TestController],
    }).compile();
    const app = moduleRef.createNestApplication();
    await app.init();

    const res = await fetch(`http://localhost:${app.port}/`);
    assertEquals(res.status, 200);
    assertEquals(await res.text(), "a");
    assertEquals(callStack, [1, 3, 2]);

    callStack.length = 0;

    await app.close();
  });

  await t.step("override interceptor", async () => {
    @Injectable()
    class AnyInterceptor2 implements NestInterceptor {
      async intercept(_ctx: Context, next: Next) {
        callStack.push(4);
        await next();
        callStack.push(5);
      }
    }

    const moduleRef = await createTestingModule({
      controllers: [TestController],
    }).overrideInterceptor(AnyInterceptor, AnyInterceptor2).compile();

    const app = moduleRef.createNestApplication();
    await app.init();

    const res = await fetch(`http://localhost:${app.port}/`);
    assertEquals(res.status, 200);
    assertEquals(await res.text(), "a");
    assertEquals(callStack, [4, 3, 5]);

    callStack.length = 0;

    await app.close();
  });
});

Deno.test(
  "override module",
  { sanitizeOps: false, sanitizeResources: false },
  async (t) => {
    const callStack: number[] = [];

    @Controller("a")
    class A {
      @Get("/")
      a() {
        callStack.push(1);
        return "a";
      }
    }

    @Module({
      controllers: [A],
    })
    class ModuleA {}

    await t.step("test origin", async () => {
      const moduleRef = await createTestingModule({
        imports: [ModuleA],
      }).compile();
      const app = moduleRef.createNestApplication();
      await app.init();

      const res = await fetch(`http://localhost:${app.port}/a`);
      assertEquals(res.status, 200);
      assertEquals(await res.text(), "a");
      assertEquals(callStack, [1]);

      callStack.length = 0;

      await app.close();
    });

    await t.step("override module", async () => {
      @Controller("b")
      class B {
        @Get("/")
        b() {
          callStack.push(2);
          return "b";
        }
      }

      @Module({
        controllers: [B],
      })
      class ModuleB {}

      const moduleRef = await createTestingModule({
        imports: [ModuleA],
      }).overrideModule(ModuleA, ModuleB).compile();

      const app = moduleRef.createNestApplication();
      await app.init();

      const res = await fetch(`http://localhost:${app.port}/b`);
      assertEquals(res.status, 200);
      assertEquals(await res.text(), "b");
      assertEquals(callStack, [2]);

      callStack.length = 0;

      await app.close();
    });

    await t.step("override module with no imports", async () => {
      @Module({})
      class ModuleB {}

      const moduleRef = await createTestingModule({}).overrideModule(
        ModuleA,
        ModuleB,
      ).compile();

      const app = moduleRef.createNestApplication();
      await app.init();

      const res = await fetch(`http://localhost:${app.port}/a`);
      assertEquals(res.status, 404);
      await res.body?.cancel();
      assertEquals(callStack, []);

      await app.close();
    });
  },
);
