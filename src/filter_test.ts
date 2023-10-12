// deno-lint-ignore-file no-unused-vars no-explicit-any require-await
import { assert, assertEquals } from "../test_deps.ts";
import { createMockContext } from "../tests/common_helper.ts";
import {
  Catch,
  checkByFilters,
  getExceptionFilters,
  UseFilters,
} from "./filter.ts";
import type { Context, ExceptionFilter } from "./interfaces/mod.ts";

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
