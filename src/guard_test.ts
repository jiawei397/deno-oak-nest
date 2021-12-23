// deno-lint-ignore-file require-await
import { Context } from "../deps.ts";
import { assert, assertEquals, testing } from "../test_deps.ts";
import { checkByGuard, getAllGuards, UseGuards } from "./guard.ts";
import { CanActivate } from "./interfaces/mod.ts";

Deno.test("getAllGuards and checkByGuard", async () => {
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

  {
    const guards = await getAllGuards(test, test.a);
    assertEquals(guards.length, 2);
    assert(guards[0] instanceof AuthGuard);
    assert(guards[1] instanceof AuthGuard2);
  }

  {
    const guards2 = await getAllGuards(test, test.b);
    assertEquals(guards2.length, 3);
    assert(guards2[0] instanceof AuthGuard);
    assert(guards2[1] instanceof AuthGuard2);
    assert(guards2[2] instanceof AuthGuard3);
  }

  {
    const ctx = testing.createMockContext({
      path: "/a",
      method: "GET",
    });
    const result = await checkByGuard(test, test.a, ctx);
    assertEquals(result, true);
  }

  {
    const ctx = testing.createMockContext({
      path: "/b",
      method: "GET",
    });
    const result = await checkByGuard(test, test.b, ctx);
    assertEquals(result, false);
  }
});
