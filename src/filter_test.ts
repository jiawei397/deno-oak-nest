// deno-lint-ignore-file no-unused-vars no-explicit-any require-await
import { Controller, Get } from "./decorators/controller.ts";
import { assert, assertEquals } from "../test_deps.ts";
import {
  createMockApp,
  createMockContext,
  mockCallMethod,
} from "../tests/common_helper.ts";
import {
  Catch,
  checkByFilters,
  getExceptionFilters,
  UseFilters,
} from "./filter.ts";
import { UseGuards } from "./guard.ts";
import type {
  CanActivate,
  Context,
  ExceptionFilter,
  NestInterceptor,
  Next,
} from "./interfaces/mod.ts";
import { Injectable } from "./decorators/inject.ts";
import { UseInterceptors } from "./interceptor.ts";
import { BadRequestException, HttpException } from "./exceptions.ts";

Deno.test("UseFilter sort", async (t) => {
  const callStack: number[] = [];

  @Catch()
  class GlobalFilter implements ExceptionFilter {
    async catch(exception: any, context: Context): Promise<void> {
      callStack.push(1);
    }
  }

  @Catch()
  class ControllerFilter implements ExceptionFilter {
    async catch(exception: any, context: Context): Promise<void> {
      callStack.push(2);
    }
  }

  @Catch()
  class Filter1 implements ExceptionFilter {
    async catch(exception: any, context: Context): Promise<void> {
      callStack.push(3);
    }
  }

  @Catch()
  class Filter2 implements ExceptionFilter {
    async catch(exception: any, context: Context): Promise<void> {
      callStack.push(4);
    }
  }

  @UseFilters(ControllerFilter)
  class TestController {
    @UseFilters(Filter1, Filter2)
    a() {
      return "a";
    }

    b() {
      throw new Error("b error");
    }
  }

  const test = new TestController();

  await t.step("a", async () => {
    const interceptors = await getExceptionFilters(test, test.a, [
      GlobalFilter,
    ]);
    assertEquals(interceptors.length, 4);
    assert(interceptors[0] instanceof GlobalFilter);
    assert(interceptors[1] instanceof ControllerFilter);
    assert(interceptors[2] instanceof Filter1);
    assert(interceptors[3] instanceof Filter2);
  });

  await t.step("b", async () => {
    const interceptors = await getExceptionFilters(test, test.b, [
      GlobalFilter,
    ]);
    assertEquals(interceptors.length, 2);
    assert(interceptors[0] instanceof GlobalFilter);
    assert(interceptors[1] instanceof ControllerFilter);
  });

  await t.step("a goto filter", async () => {
    const ctx = createMockContext({
      path: "/a",
      method: "GET",
    });
    await checkByFilters(
      ctx,
      test,
      [
        GlobalFilter,
      ],
      test.a,
      new Error("error"),
    );
    assertEquals(callStack, [4]);
    callStack.length = 0;
  });

  await t.step("get b", async () => {
    const ctx = createMockContext({
      path: "/b",
      method: "GET",
    });
    await checkByFilters(
      ctx,
      test,
      [
        GlobalFilter,
      ],
      test.b,
      new Error("b error"),
    );
    assertEquals(callStack, [2]);
    callStack.length = 0;
  });
});

Deno.test("filter and guard", async (t) => {
  const callStack: number[] = [];

  @Catch()
  class GlobalFilter implements ExceptionFilter {
    async catch(exception: any, context: Context): Promise<void> {
      callStack.push(1);
      context.response.body = "catched error";
    }
  }

  @Injectable()
  class AuthGuard implements CanActivate {
    async canActivate(_context: Context): Promise<boolean> {
      callStack.push(2);
      return false;
    }
  }

  @UseFilters(GlobalFilter)
  @Controller("")
  class A {
    @UseGuards(AuthGuard)
    @Get("/a")
    a() {
      throw new Error("a error");
    }

    @Get("/b")
    b() {
      throw new Error("b error");
    }

    @Get("/c")
    c() {
      return "success";
    }
  }

  await t.step("guard not pass and should into filter", async () => {
    const ctx = createMockContext({
      path: "/a",
      method: "GET",
    });
    const app = createMockApp();
    app.addController(A);
    await mockCallMethod(app, ctx);

    assertEquals(callStack, [2, 1]);

    assertEquals(ctx.response.body, "catched error");
    callStack.length = 0;
  });

  await t.step("no guard and error into filter", async () => {
    const ctx = createMockContext({
      path: "/b",
      method: "GET",
    });
    const app = createMockApp();
    app.addController(A);
    await mockCallMethod(app, ctx);

    assertEquals(callStack, [1]);
    callStack.length = 0;
  });

  await t.step("guard not work and not into filter", async () => {
    const ctx = createMockContext({
      path: "/c",
      method: "GET",
    });
    const app = createMockApp();
    app.addController(A);
    await mockCallMethod(app, ctx);
    assertEquals(callStack, []);
  });
});

Deno.test("filter and interceptor", async (t) => {
  const callStack: number[] = [];

  @Injectable()
  class GlobalInterceptor implements NestInterceptor {
    async intercept(_ctx: Context, next: Next) {
      callStack.push(1);
      await next();
      callStack.push(2);
    }
  }

  @Injectable()
  class ErrorInterceptor implements NestInterceptor {
    async intercept(ctx: Context, next: Next) {
      callStack.push(4);
      try {
        await next();
      } catch (error) {
        callStack.push(5);
        ctx.response.status = 404;
        throw error;
      }
    }
  }

  @Injectable()
  class ErrorCatchInterceptor implements NestInterceptor {
    async intercept(ctx: Context, next: Next) {
      callStack.push(6);
      try {
        await next();
      } catch (error) {
        callStack.push(7);
        ctx.response.status = 404;
        ctx.response.body = "catched by interceptor";
      }
    }
  }

  @Catch()
  class GlobalFilter implements ExceptionFilter {
    async catch(exception: any, context: Context): Promise<void> {
      callStack.push(3);
      context.response.body = "catched";
    }
  }

  @UseFilters(GlobalFilter)
  @UseInterceptors(GlobalInterceptor)
  @Controller("")
  class A {
    @Get("/a")
    a() {
      throw new Error("a error");
    }

    @Get("/b")
    b() {
      return "b";
    }

    @Get("/c")
    @UseInterceptors(ErrorInterceptor)
    c() {
      throw new Error("c error");
    }

    @Get("/d")
    @UseInterceptors(ErrorCatchInterceptor)
    d() {
      throw new Error("d error");
    }
  }

  await t.step("filter and interceptor work together", async () => {
    const ctx = createMockContext({
      path: "/a",
      method: "GET",
    });
    const app = createMockApp();
    app.addController(A);
    await mockCallMethod(app, ctx);
    assertEquals(callStack, [1, 3]);
    assertEquals(ctx.response.body, "catched");
    // assertEquals(ctx.response.status, 200);

    callStack.length = 0;
  });

  await t.step("only interceptor", async () => {
    const ctx = createMockContext({
      path: "/b",
      method: "GET",
    });
    const app = createMockApp();
    app.addController(A);
    await mockCallMethod(app, ctx);
    assertEquals(callStack, [1, 2]);
    assertEquals(ctx.response.body, "b");

    callStack.length = 0;
  });

  await t.step(
    "filter and interceptor work together, and catch error, change status",
    async () => {
      const ctx = createMockContext({
        path: "/c",
        method: "GET",
      });
      const app = createMockApp();
      app.addController(A);
      await mockCallMethod(app, ctx);
      assertEquals(callStack, [1, 4, 5, 3]);
      assertEquals(ctx.response.body, "catched");
      assertEquals(ctx.response.status, 404);

      callStack.length = 0;
    },
  );

  await t.step(
    "interceptor catch error, will not to filter",
    async () => {
      const ctx = createMockContext({
        path: "/d",
        method: "GET",
      });
      const app = createMockApp();
      app.addController(A);
      await mockCallMethod(app, ctx);
      assertEquals(callStack, [1, 6, 7, 2]);
      assertEquals(ctx.response.body, "catched by interceptor");
      assertEquals(ctx.response.status, 404);

      callStack.length = 0;
    },
  );
});

Deno.test("multiple filter", async (t) => {
  const callStack: number[] = [];

  @Catch()
  class GlobalFilter implements ExceptionFilter {
    async catch(exception: any, context: Context): Promise<void> {
      callStack.push(1);
      assertEquals(exception.message, "http error");
      context.response.body = "catched";
    }
  }

  @Catch(HttpException)
  class HttpExceptionFilter implements ExceptionFilter {
    async catch(exception: any, context: Context): Promise<void> {
      callStack.push(2);
      throw new Error("http error");
    }
  }

  @Catch(HttpException)
  class HttpExceptionFilter2 implements ExceptionFilter {
    async catch(exception: any, context: Context): Promise<void> {
      callStack.push(5);
      context.response.body = "catched2";
    }
  }

  @UseFilters(GlobalFilter)
  @Controller("")
  class A {
    @Get("/a")
    @UseFilters(HttpExceptionFilter)
    a() {
      callStack.push(3);
      throw new BadRequestException("a error");
    }

    @Get("/b")
    @UseFilters(HttpExceptionFilter2)
    b() {
      callStack.push(4);
      throw new BadRequestException("b error");
    }
  }

  await t.step("first filter throws error", async () => {
    const ctx = createMockContext({
      path: "/a",
      method: "GET",
    });
    const app = createMockApp();
    app.addController(A);
    await mockCallMethod(app, ctx);

    assertEquals(callStack, [3, 2, 1]);
    assertEquals(ctx.response.body, "catched");
    assertEquals(ctx.response.status, 200);

    callStack.length = 0;
  });

  await t.step("first filter normal catched", async () => {
    const ctx = createMockContext({
      path: "/b",
      method: "GET",
    });
    const app = createMockApp();
    app.addController(A);
    await mockCallMethod(app, ctx);

    assertEquals(callStack, [4, 5]);
    assertEquals(ctx.response.body, "catched2");
    assertEquals(ctx.response.status, 200);

    callStack.length = 0;
  });
});
