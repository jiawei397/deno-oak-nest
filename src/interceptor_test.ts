// deno-lint-ignore-file
import { Context } from "../deps.ts";
import { assert, assertEquals, testing } from "../test_deps.ts";
import {
  checkByInterceptors,
  getInterceptors,
  UseInterceptors,
} from "./interceptor.ts";
import type { NestInterceptor, Next } from "./interfaces/mod.ts";

Deno.test("UseInterceptors sort", async (t) => {
  const callStack: number[] = [];

  class GlobalInterceptor implements NestInterceptor {
    async intercept(_ctx: Context, next: Next) {
      callStack.push(1);
      const result = await next();
      callStack.push(2);
      return result;
    }
  }

  class ControllerInterceptor implements NestInterceptor {
    async intercept(_ctx: Context, next: Next) {
      callStack.push(3);
      const result = await next();
      callStack.push(4);
      return result;
    }
  }

  class Interceptor1 implements NestInterceptor {
    async intercept(_ctx: Context, next: Next) {
      callStack.push(5);
      const result = await next();
      callStack.push(6);
      return result;
    }
  }
  class Interceptor2 implements NestInterceptor {
    async intercept(_ctx: Context, next: Next) {
      callStack.push(7);
      const result = await next();
      callStack.push(8);
      return result;
    }
  }

  @UseInterceptors(ControllerInterceptor)
  class TestController {
    @UseInterceptors(Interceptor1, Interceptor2)
    a() {
      return "a";
    }

    b() {
      return "b";
    }
  }

  const test = new TestController();

  await t.step("a", async () => {
    const interceptors = await getInterceptors(test, test.a, [
      GlobalInterceptor,
    ]);
    assertEquals(interceptors.length, 4);
    assert(interceptors[0] instanceof GlobalInterceptor);
    assert(interceptors[1] instanceof ControllerInterceptor);
    assert(interceptors[2] instanceof Interceptor1);
    assert(interceptors[3] instanceof Interceptor2);
  });

  await t.step("b", async () => {
    const interceptors = await getInterceptors(test, test.b, [
      GlobalInterceptor,
    ]);
    assertEquals(interceptors.length, 2);
    assert(interceptors[0] instanceof GlobalInterceptor);
    assert(interceptors[1] instanceof ControllerInterceptor);
  });

  await t.step("get a", async () => {
    const ctx = testing.createMockContext({
      path: "/a",
      method: "GET",
    });
    const result = await checkByInterceptors(
      ctx,
      [
        GlobalInterceptor,
      ],
      test.a,
      {
        target: test,
        args: [],
        methodName: "a",
        methodType: "GET",
        fn: test.a,
      },
    );
    assertEquals(result, "a");
    assertEquals(callStack, [1, 3, 5, 7, 8, 6, 4, 2]);
    callStack.length = 0;
  });

  await t.step("get b", async () => {
    const ctx = testing.createMockContext({
      path: "/b",
      method: "GET",
    });
    const result = await checkByInterceptors(
      ctx,
      [
        GlobalInterceptor,
      ],
      test.b,
      {
        target: test,
        args: [],
        methodName: "b",
        methodType: "GET",
        fn: test.b,
      },
    );
    assertEquals(result, "b");
    assertEquals(callStack, [1, 3, 4, 2]);
    callStack.length = 0;
  });
});

Deno.test("UseInterceptors cache", async (t) => {
  const callStack: number[] = [];

  class CacheInterceptor implements NestInterceptor {
    caches = new Set<number>();

    async intercept(_ctx: Context, next: Next) {
      if (this.caches.has(1)) {
        return "cached";
      }
      this.caches.add(1);
      callStack.push(1);
      const result = await next();
      callStack.push(2);
      return result;
    }
  }

  @UseInterceptors(CacheInterceptor)
  class TestController {
    a() {
      callStack.push(3);
      return "a";
    }
  }

  const test = new TestController();
  const ctx = testing.createMockContext({
    path: "/a",
    method: "GET",
  });

  await t.step("first get", async () => {
    const result = await checkByInterceptors(
      ctx,
      [],
      test.a,
      {
        target: test,
        args: [],
        methodName: "a",
        methodType: "GET",
        fn: test.a,
      },
    );
    assertEquals(result, "a");
    assertEquals(callStack, [1, 3, 2]);
    callStack.length = 0;
  });

  await t.step("second get", async () => {
    const result2 = await checkByInterceptors(
      ctx,
      [],
      test.a,
      {
        target: test,
        args: [],
        methodName: "a",
        methodType: "GET",
        fn: test.a,
      },
    );
    assertEquals(result2, "cached");
    assertEquals(callStack, []);

    callStack.length = 0;
  });
});

Deno.test("UseInterceptors intercept", async () => {
  const callStack: number[] = [];

  class Interceptor implements NestInterceptor {
    async intercept(_ctx: Context, _next: Next) {
      callStack.push(1);
      return "intercepted";
    }
  }

  @UseInterceptors(Interceptor)
  class TestController {
    a() {
      callStack.push(2);
      return "a";
    }
  }

  const test = new TestController();

  const ctx = testing.createMockContext({
    path: "/a",
    method: "GET",
  });
  const result = await checkByInterceptors(
    ctx,
    [],
    test.a,
    {
      target: test,
      args: [],
      methodName: "a",
      methodType: "GET",
      fn: test.a,
    },
  );
  assertEquals(result, "intercepted");
  assertEquals(callStack, [1]);

  callStack.length = 0;
});
