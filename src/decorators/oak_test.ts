// deno-lint-ignore-file no-explicit-any
import {
  assert,
  assertEquals,
  IsString,
  Max,
  Min,
  OakCookie,
  testing,
} from "../../test_deps.ts";
import { createMockContext } from "../../tests/common_test.ts";
import { Router } from "../router.ts";
import { Controller, Get, Post } from "./controller.ts";
import {
  Body,
  ControllerName,
  Cookies,
  Headers,
  MethodName,
  Params,
  Query,
  Req,
  Res,
  UploadedFile,
} from "./oak.ts";

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
    c: "4",
  };
  const mockPath = "/a?a=b&c=4";

  @Controller("")
  class A {
    @Get("a")
    a(
      @Query() query: any,
      @Query("a") a: string,
      @Query("c") c: string,
      @Query("e") e: string,
      @Query("c") c1: number,
    ) {
      callStack.push(1);
      assertEquals(query, mockQuery);
      assertEquals(a, mockQuery.a);
      assertEquals(c, mockQuery.c);
      assertEquals(e, undefined);
      assertEquals<number>(c1, Number(mockQuery.c));
      assert(typeof c1 === "number");
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
      @Params("id") id2: number,
      @Params("name") name: string,
    ) {
      callStack.push(1);
      assertEquals(id, "1");
      assertEquals(params, { id: "1" });
      assert(typeof id2 === "number");
      assertEquals<number>(id2, 1);
      assert(!name);
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

Deno.test("Req, Res, ControllerName, MethodName", async () => {
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
      @ControllerName() controllerName: string,
      @MethodName() methodName: string,
    ) {
      callStack.push(1);
      assertEquals(req, ctx.request);
      assertEquals(res, ctx.response);
      assertEquals(controllerName, "A");
      assertEquals(methodName, "a");
    }
  }

  const router = new Router();
  await router.add(A);

  const mw = router.routes();
  const next = testing.createMockNext();

  await mw(ctx, next);

  assertEquals(callStack, [1]);
});

Deno.test("Cookies", async () => {
  const callStack: number[] = [];
  const ctx = testing.createMockContext({
    path: "/a",
    method: "GET",
  });
  ctx.request.headers.set("Cookie", "a=b; c=4;");
  ctx.cookies = new OakCookie(ctx.request, ctx.response);
  @Controller("")
  class A {
    @Get("a")
    async a(
      @Cookies() cookie: any,
      @Cookies("a") a: string,
      @Cookies("c") c: string,
      @Cookies("c") c1: number,
      @Cookies("d") d: string,
    ) {
      callStack.push(1);
      assertEquals(cookie, ctx.cookies);
      assertEquals(await cookie.get("a"), "b");
      assertEquals(await cookie.get("c"), "4");
      assertEquals(a, "b");
      assertEquals(c, "4");
      assertEquals(c1, 4);
      assert(typeof c1 === "number");
      assert(!d);
    }
  }

  const router = new Router();
  await router.add(A);

  const mw = router.routes();
  const next = testing.createMockNext();

  await mw(ctx, next);

  assertEquals(callStack, [1]);
  callStack.length = 0;
});

Deno.test("Headers", async () => {
  const callStack: number[] = [];
  const ctx = testing.createMockContext({
    path: "/a",
    method: "GET",
  });
  ctx.request.headers.set("a", "b");
  ctx.request.headers.set("c", "4");

  @Controller("")
  class A {
    @Get("a")
    a(
      @Headers() headers: any,
      @Headers("a") a: string,
      @Headers("c") c: string,
      @Headers("c") c1: number,
    ) {
      callStack.push(1);
      assertEquals(headers, ctx.request.headers);
      assertEquals(headers.get("a"), "b");
      assertEquals(a, "b");
      assertEquals<string>(c, "4");
      assertEquals<number>(c1, 4);
      assert(typeof c1 === "number");
    }
  }

  const router = new Router();
  await router.add(A);

  const mw = router.routes();
  const next = testing.createMockNext();

  await mw(ctx, next);

  assertEquals(callStack, [1]);
  callStack.length = 0;
});

Deno.test("UploadedFile", async () => {
  const callStack: number[] = [];
  const fileMockData = {
    fields: { test: "a" },
    files: [
      {
        content: undefined,
        contentType: "text/markdown",
        name: "file",
        filename: "/var/folders/xx.md",
        originalName: "b.md",
      },
    ],
  };

  @Controller("")
  class A {
    @Post("a")
    noUpload(@UploadedFile() body: any) {
      callStack.push(1);
      assertEquals(body, undefined, "get will not pass body");
    }

    @Post("b")
    upload(@UploadedFile() body: any) {
      callStack.push(2);
      assertEquals(body, fileMockData, "get will pass body");
    }
  }

  const router = new Router();
  await router.add(A);

  {
    const ctx = createMockContext({
      path: "/a",
      method: "POST",
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
    const ctx = createMockContext({
      path: "/b",
      method: "POST",
      body: {
        type: "form-data",
        value: {
          read: () => Promise.resolve(fileMockData),
        },
      },
    });
    const mw = router.routes();
    const next = testing.createMockNext();

    await mw(ctx, next);

    assertEquals(callStack, [2]);
    callStack.length = 0;
  }
});
