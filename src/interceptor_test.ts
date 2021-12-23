import { Context } from "../deps.ts";
import { assert, assertEquals, testing } from "../test_deps.ts";
import {
  checkByInterceptors,
  getInterceptors,
  UseInterceptors,
} from "./interceptor.ts";
import { NestInterceptor, Next } from "./interfaces/mod.ts";

Deno.test("UseInterceptors", async () => {
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

  {
    const interceptors = await getInterceptors(test, test.a, [
      GlobalInterceptor,
    ]);
    assertEquals(interceptors.length, 4);
    assert(interceptors[0] instanceof GlobalInterceptor);
    assert(interceptors[1] instanceof ControllerInterceptor);
    assert(interceptors[2] instanceof Interceptor1);
    assert(interceptors[3] instanceof Interceptor2);
  }

  {
    const interceptors = await getInterceptors(test, test.b, [
      GlobalInterceptor,
    ]);
    assertEquals(interceptors.length, 2);
    assert(interceptors[0] instanceof GlobalInterceptor);
    assert(interceptors[1] instanceof ControllerInterceptor);
  }

  {
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
    console.log(callStack);
    assertEquals(callStack, [1, 3, 5, 7, 8, 6, 4, 2]);
    callStack.length = 0;
  }

  {
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
    console.log(callStack);
    assertEquals(callStack, [1, 3, 4, 2]);
    callStack.length = 0;
  }
});
