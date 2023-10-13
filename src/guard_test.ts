// deno-lint-ignore-file require-await
import { assert, assertEquals } from "../test_deps.ts";
import {
  createMockApp,
  createMockContext,
  mockCallMethod,
} from "../tests/common_helper.ts";
import { Controller, Get } from "./decorators/controller.ts";
import { Injectable } from "./decorators/inject.ts";
import {
  checkByGuard,
  getAllGuards,
  GetMetadata,
  getMetadataForGuard,
  Reflector,
  SetMetadata,
  UseGuards,
} from "./guard.ts";
import type { CanActivate, Context } from "./interfaces/mod.ts";

Deno.test("getAllGuards and checkByGuard", async (t) => {
  class AuthGuard implements CanActivate {
    async canActivate(_context: Context): Promise<boolean> {
      return true;
    }
  }

  class AuthGuard2 implements CanActivate {
    async canActivate(_context: Context): Promise<boolean> {
      return true;
    }
  }

  class AuthGuard3 implements CanActivate {
    async canActivate(_context: Context): Promise<boolean> {
      return false;
    }
  }

  @UseGuards(AuthGuard)
  class TestController {
    @UseGuards(AuthGuard2)
    a() {
    }

    @UseGuards(AuthGuard2, AuthGuard3)
    b() {
    }
  }

  const test = new TestController();

  await t.step("test a", async () => {
    const guards = await getAllGuards(test, test.a, []);
    assertEquals(guards.length, 2);
    assert(guards[0] instanceof AuthGuard);
    assert(guards[1] instanceof AuthGuard2);
  });

  await t.step("test a with global guards", async () => {
    const guards = await getAllGuards(test, test.a, [AuthGuard3]);
    assertEquals(guards.length, 3);
    assert(guards[0] instanceof AuthGuard3);
    assert(guards[1] instanceof AuthGuard);
    assert(guards[2] instanceof AuthGuard2);
  });

  await t.step("test b", async () => {
    const guards2 = await getAllGuards(test, test.b, []);
    assertEquals(guards2.length, 3);
    assert(guards2[0] instanceof AuthGuard);
    assert(guards2[1] instanceof AuthGuard2);
    assert(guards2[2] instanceof AuthGuard3);
  });

  await t.step("get a", async () => {
    const ctx = createMockContext({
      path: "/a",
      method: "GET",
    });
    const result = await checkByGuard(test, test.a, ctx, []);
    assertEquals(result, true);
  });

  await t.step("get b", async () => {
    const ctx = createMockContext({
      path: "/b",
      method: "GET",
    });
    const result = await checkByGuard(test, test.b, ctx, []);
    assertEquals(result, false);
  });
});

Deno.test("SetMetadata and GetMetadata", async () => {
  @SetMetadata("roles", ["admin"])
  class A {
    @SetMetadata("roles", ["user"])
    a() {
    }
  }

  const result = GetMetadata("roles", A);
  assertEquals(result, ["admin"]);

  const result2 = GetMetadata("roles", A.prototype.a);
  assertEquals(result2, ["user"]);
});

Deno.test("getMetadataForGuard", async () => {
  class AuthGuard implements CanActivate {
    async canActivate(_context: Context): Promise<boolean> {
      return true;
    }
  }
  @UseGuards(AuthGuard)
  class TestController {
    @SetMetadata("roles", ["user"])
    a() {
    }
  }

  const test = new TestController();
  const ctx = createMockContext({
    path: "/a",
    method: "GET",
  });
  await checkByGuard(test, test.a, ctx, []);
  const result = getMetadataForGuard("roles", ctx);
  assertEquals(result, ["user"]);
});

Deno.test("Reflector", async () => {
  const callStack: number[] = [];

  @Injectable() // must injectable
  class AuthGuard implements CanActivate {
    constructor(private readonly reflector: Reflector) {
    }
    async canActivate(context: Context): Promise<boolean> {
      callStack.push(1);
      const role = this.reflector.get<string[]>("roles", context);
      assertEquals(role, ["user"]);
      assertEquals(getMetadataForGuard<string[]>("roles", context), ["user"]);
      return true;
    }
  }
  @UseGuards(AuthGuard)
  @Controller("")
  class TestController {
    @SetMetadata("roles", ["user"])
    @Get("/a")
    a() {
    }
  }

  assertEquals(callStack, []);

  const ctx = createMockContext({
    path: "/a",
    method: "GET",
  });
  const app = createMockApp();
  app.addController(TestController);

  await mockCallMethod(app, ctx);

  assertEquals(callStack, [1]);
});

Deno.test("application guard can change body and status in canActive", async () => {
  const app = createMockApp();
  const changedBody = "changed body";
  const changedStatus = 500;

  class AuthGuard implements CanActivate {
    async canActivate(context: Context): Promise<boolean> {
      context.response.status = changedStatus;
      context.response.body = changedBody;
      return false;
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

  assertEquals(ctx.response.body, changedBody);
  assertEquals(ctx.response.status, changedStatus);
  assertEquals(callStack, []);
});
