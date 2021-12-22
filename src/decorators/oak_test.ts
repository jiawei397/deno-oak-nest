// deno-lint-ignore-file no-explicit-any
import {
  assert,
  assertEquals,
  IsString,
  Max,
  Min,
  testing,
} from "../../test_deps.ts";
import { Router } from "../router.ts";
import { Controller, Get, Post } from "./controller.ts";
import { Body, Params, Query, Req, Res } from "./oak.ts";

Deno.test("body", async () => {
  const mockContext = (options: {
    path: string;
    method: string;
    body?: {
      type: string;
      value: any;
    };
  }) => {
    const { path, method, body } = options;
    const ctx = testing.createMockContext({
      path,
      method,
    });
    (ctx.request as any).body = () => {
      return body;
    };
    return ctx;
  };

  // deno-lint-ignore no-unused-vars
  class Dto {
    @Max(20)
    @Min(10)
    age!: number;

    @IsString()
    name!: string;
  }

  const callStack: number[] = [];
  const normalBody = {
    name: "test",
    age: 20,
  };

  const errorBody = {
    name: "test",
    age: 30,
  };

  @Controller("")
  class A {
    @Get("a")
    a(@Body() body: number) {
      callStack.push(1);
      assertEquals(body, undefined, "get will not pass body");
    }

    @Post("a")
    postA(@Body() body: number) {
      callStack.push(2);
      assertEquals(body, 1);
    }

    @Post("b")
    normal(@Body() body: Dto) {
      callStack.push(3);
      assertEquals(body, normalBody);
    }

    @Post("c")
    error(@Body() _body: Dto) {
      callStack.push(4);
      assert(false, "should not be here");
    }
  }

  const router = new Router();
  await router.add(A);

  {
    const ctx = mockContext({
      path: "/a",
      method: "GET",
      body: {
        type: "undefined",
        value: undefined,
      },
    });

    const mw = router.routes();
    const next = testing.createMockNext();

    await mw(ctx, next);

    assertEquals(callStack, [1]);

    callStack.length = 0;
  }

  {
    const ctx = mockContext({
      path: "/a",
      method: "POST",
      body: {
        type: "json",
        value: Promise.resolve(1),
      },
    });
    const mw = router.routes();
    const next = testing.createMockNext();

    await mw(ctx, next);

    assertEquals(callStack, [2]);
    callStack.length = 0;
  }

  {
    const ctx = mockContext({
      path: "/b",
      method: "POST",
      body: {
        type: "json",
        value: Promise.resolve(normalBody),
      },
    });
    const mw = router.routes();
    const next = testing.createMockNext();

    await mw(ctx, next);

    assertEquals(callStack, [3]);
    callStack.length = 0;
  }

  {
    const ctx = mockContext({
      path: "/c",
      method: "POST",
      body: {
        type: "json",
        value: Promise.resolve(errorBody),
      },
    });
    const mw = router.routes();
    const next = testing.createMockNext();

    try {
      await mw(ctx, next);
      assertEquals(callStack, [5]);
    } catch {
      callStack.push(6);
    }
    assertEquals(callStack, [6]);

    callStack.length = 0;
  }
});

Deno.test("Query", async () => {
  const callStack: number[] = [];
  const mockQuery = {
    a: "b",
    c: "d",
  };
  const mockPath = "/a?a=b&c=d";

  @Controller("")
  class A {
    @Get("a")
    a(
      @Query() query: any,
      @Query("a") a: string,
      @Query("c") c: string,
      @Query("e") e: string,
    ) {
      callStack.push(1);
      assertEquals(query, mockQuery);
      assertEquals(a, mockQuery.a);
      assertEquals(c, mockQuery.c);
      assertEquals(e, undefined);
    }

    @Post("a")
    postA(
      @Query() query: any,
      @Query("a") a: string,
      @Query("c") c: string,
      @Query("e") e: string,
    ) {
      callStack.push(2);
      assertEquals(query, mockQuery);
      assertEquals(a, mockQuery.a);
      assertEquals(c, mockQuery.c);
      assertEquals(e, undefined);
    }

    @Get("b")
    testNoQuery(
      @Query() query: any,
    ) {
      callStack.push(3);
      assertEquals(query, {});
    }
  }

  const router = new Router();
  await router.add(A);

  {
    const ctx = testing.createMockContext({
      path: mockPath,
      method: "GET",
    });
    const mw = router.routes();
    const next = testing.createMockNext();

    await mw(ctx, next);

    assertEquals(callStack, [1]);
    callStack.length = 0;
  }

  {
    const ctx = testing.createMockContext({
      method: "POST",
      path: mockPath,
    });
    const mw = router.routes();
    const next = testing.createMockNext();

    await mw(ctx, next);

    assertEquals(callStack, [2]);
    callStack.length = 0;
  }

  {
    const ctx = testing.createMockContext({
      path: "/b",
      method: "GET",
    });
    const mw = router.routes();
    const next = testing.createMockNext();

    await mw(ctx, next);

    assertEquals(callStack, [3]);
    callStack.length = 0;
  }
});

Deno.test("Params", async () => {
  const callStack: number[] = [];

  @Controller("")
  class A {
    @Get("a/:id")
    a(
      @Params() params: any,
      @Params("id") id: string,
    ) {
      callStack.push(1);
      assertEquals(id, "1");
      assertEquals(params, { id: "1" });
    }

    @Get("b")
    testNoParam(
      @Params() params: any,
    ) {
      callStack.push(2);
      assertEquals(params, {});
    }
  }

  const router = new Router();
  await router.add(A);

  {
    const ctx = testing.createMockContext({
      path: "/a/1",
      method: "GET",
    });
    const mw = router.routes();
    const next = testing.createMockNext();

    await mw(ctx, next);

    assertEquals(callStack, [1]);
    callStack.length = 0;
  }

  {
    const ctx = testing.createMockContext({
      path: "/b",
      method: "GET",
    });
    const mw = router.routes();
    const next = testing.createMockNext();

    await mw(ctx, next);

    assertEquals(callStack, [2]);
    callStack.length = 0;
  }
});

Deno.test("Req and Res", async () => {
  const callStack: number[] = [];
  const ctx = testing.createMockContext({
    path: "/a",
    method: "GET",
  });

  @Controller("")
  class A {
    @Get("a")
    a(
      @Req() req: any,
      @Res() res: any,
    ) {
      callStack.push(1);
      assertEquals(req, ctx.request);
      assertEquals(res, ctx.response);
    }
  }

  const router = new Router();
  await router.add(A);

  const mw = router.routes();
  const next = testing.createMockNext();

  await mw(ctx, next);

  assertEquals(callStack, [1]);
});
