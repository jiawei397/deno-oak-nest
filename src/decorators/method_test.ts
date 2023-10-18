// deno-lint-ignore-file no-explicit-any
import {
  assert,
  assertEquals,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from "../../test_deps.ts";
import {
  createMockApp,
  createMockContext,
  mockCallMethod,
} from "../../tests/common_helper.ts";
import { Controller, Get, Post } from "./controller.ts";
import {
  Body,
  ControllerName,
  Cookies,
  Form,
  getTransNumOrBoolOrArray,
  Headers,
  Host,
  Ip,
  MethodName,
  Params,
  Property,
  Query,
  Req,
  Res,
  transAndValidateByCls,
  UploadedFile,
} from "./method.ts";

Deno.test("getTransNumOrBoolOrArray", () => {
  assertEquals(getTransNumOrBoolOrArray(Number, "1"), 1);
  assertEquals(getTransNumOrBoolOrArray(Boolean, "true"), true);
  assertEquals(getTransNumOrBoolOrArray(Boolean, "false"), false);
  assertEquals(getTransNumOrBoolOrArray(Boolean, "aa"), false);
  assertEquals(getTransNumOrBoolOrArray(Object, "aa"), "aa");
  assertEquals(getTransNumOrBoolOrArray(Array, "id, name"), ["id", "name"]);
  assertEquals(getTransNumOrBoolOrArray(Array, "1, 2", "number"), [1, 2]);
  assertEquals(getTransNumOrBoolOrArray(Array, "1,2", "number"), [1, 2]);
  assertEquals(getTransNumOrBoolOrArray(Array, "true, false", "boolean"), [
    true,
    false,
  ]);
});

Deno.test("body", async (t) => {
  // deno-lint-ignore no-unused-vars
  class Dto {
    @Max(20)
    @Min(10)
    age: number;

    @IsString()
    name: string;
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
    normal(@Body() body: Dto, @Body("name") name: string) {
      callStack.push(3);
      assertEquals(body, normalBody);
      assertEquals(name, normalBody.name);
    }

    @Post("c")
    error(@Body() _body: Dto) {
      callStack.push(4);
      assert(false, "should not be here");
    }
  }

  const app = createMockApp();
  app.addController(A);

  await t.step("get", async () => {
    const ctx = createMockContext({
      path: "/a",
      method: "GET",
      body: {
        type: "undefined",
        value: undefined,
      },
    });

    await mockCallMethod(app, ctx);
    assertEquals(ctx.response.status, 400);

    assertEquals(callStack, []);

    callStack.length = 0;
  });

  await t.step("post json number", async () => {
    const ctx = createMockContext({
      path: "/a",
      method: "POST",
      body: {
        type: "json",
        value: Promise.resolve(1),
      },
    });

    await mockCallMethod(app, ctx);
    assertEquals(ctx.response.status, 400);

    assertEquals(callStack, []);
    callStack.length = 0;
  });

  await t.step("post normal body", async () => {
    const ctx = createMockContext({
      path: "/b",
      method: "POST",
      reqHeaders: {
        "content-type": "application/json",
      },
      body: {
        type: "json",
        value: Promise.resolve(normalBody),
      },
    });

    await mockCallMethod(app, ctx);

    assertEquals(callStack, [3]);
    callStack.length = 0;
  });

  await t.step("post error body", async () => {
    const ctx = createMockContext({
      path: "/c",
      method: "POST",
      body: {
        type: "json",
        value: Promise.resolve(errorBody),
      },
    });

    try {
      await mockCallMethod(app, ctx);
      assertEquals(callStack, [5]);
    } catch {
      callStack.push(6);
    }
    assertEquals(callStack, [6]);

    callStack.length = 0;
  });
});

Deno.test("Query", async (t) => {
  const callStack: number[] = [];
  const mockQuery = {
    a: "b",
    c: "4",
    f: "false",
    g: "true",
    i: "dd",
    j: "5",
  };
  const mockPath = "/a?a=b&c=4&f=false&g=true&i=dd&j=5";
  const mockErrorPath = "/d?a=b&c=30";
  const mockErrorButNotValidatePath = "/e?a=b&d=30";
  const mockErrorButNotValidatePathQuery = {
    a: "b",
    d: "30",
  };
  const mockErrorValidatePath = "/f?a=b&d=30";

  // deno-lint-ignore no-unused-vars
  class QueryDto {
    @Property()
    a: string;

    @Property()
    @Max(20)
    c: number;

    @Property()
    f: boolean;

    @Property()
    g: boolean;

    @Property()
    i: boolean;

    j: number;

    k: boolean;

    l: number;
  }

  // deno-lint-ignore no-unused-vars
  class QueryNotValidateDto {
    a: string;

    d: number;
  }

  // deno-lint-ignore no-unused-vars
  class QueryValidateErrorDto {
    a: string;

    @Max(20)
    d: number;
  }

  @Controller("")
  class A {
    @Get("a")
    a(
      @Query() query: any,
      @Query("a") a: string,
      @Query("c") c: string,
      @Query("c") c1: number,
      @Query("e") e: string,
      @Query("f") f: boolean,
      @Query("g") g: boolean,
      @Query("h") h: boolean,
      @Query() query2: QueryDto,
    ) {
      callStack.push(1);
      assertEquals(query, mockQuery);
      assertEquals(a, mockQuery.a);
      assertEquals(c, mockQuery.c);
      assertEquals(e, undefined);
      assertEquals<number>(c1, Number(mockQuery.c));
      assert(typeof c1 === "number");
      assertEquals(f, false);
      assertEquals(g, true);
      assertEquals(
        h,
        undefined,
        "if no parsed, should be undefined instead of false",
      );
      // query2 is translated
      assert(typeof query2.c === "number");
      assertEquals(query2.c, Number(mockQuery.c));
      assertEquals(query2.a, mockQuery.a);
      assert(query2.f === false);
      assert(query2.g === true);
      assert(query2.i === false);
      assertEquals<string | number>(query2.j, mockQuery.j);
      assert(typeof query2.j === "string", "not transferred");
      assert(query2.k === undefined, "not transferred");
      assert(query2.l === undefined, "not transferred");
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

    @Get("d")
    testErrorQuery(@Query() _query: QueryDto) {
      assert(false, "should not be here");
    }

    @Get("e")
    testErrorButNotValidateQuery(@Query() query: QueryNotValidateDto) {
      callStack.push(5);
      assertEquals(query.a, mockErrorButNotValidatePathQuery.a);
      assertEquals<string | number>(
        query.d,
        mockErrorButNotValidatePathQuery.d,
      );
      assert(
        typeof query.d === "string",
        "not set Property, so should be string type",
      );
    }

    @Get("f")
    testErrorValidateQuery(@Query() _query: QueryValidateErrorDto) {
      assert(false, "should not be here");
    }
  }

  const app = createMockApp();
  app.addController(A);

  await t.step("get mock", async () => {
    const ctx = createMockContext({
      path: mockPath,
      method: "GET",
      queries: mockQuery,
    });
    await mockCallMethod(app, ctx);

    assertEquals(callStack, [1]);
    callStack.length = 0;
  });

  await t.step("post mock", async () => {
    const ctx = createMockContext({
      method: "POST",
      path: mockPath,
      queries: mockQuery,
    });
    await mockCallMethod(app, ctx);

    assertEquals(callStack, [2]);
    callStack.length = 0;
  });

  await t.step("get b", async () => {
    const ctx = createMockContext({
      path: "/b",
      method: "GET",
    });
    await mockCallMethod(app, ctx);

    assertEquals(callStack, [3]);
    callStack.length = 0;
  });

  await t.step("get error", async () => {
    const ctx = createMockContext({
      path: mockErrorPath,
      method: "GET",
    });

    await mockCallMethod(app, ctx);
    assertEquals(ctx.response.status, 400);
  });

  await t.step("get error but not validate path", async () => {
    const ctx = createMockContext({
      path: mockErrorButNotValidatePath,
      method: "GET",
      queries: mockErrorButNotValidatePathQuery,
    });
    await mockCallMethod(app, ctx);
    assertEquals(callStack, [5]);
    callStack.length = 0;
  });

  await t.step("get validate path", async () => {
    const ctx = createMockContext({
      path: mockErrorValidatePath,
      method: "GET",
    });
    await mockCallMethod(app, ctx);
    assertEquals(ctx.response.status, 400);
  });
});

Deno.test("Params", async (t) => {
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

  const app = createMockApp();
  app.addController(A);

  await t.step("a 1", async () => {
    const ctx = createMockContext({
      path: "/a/:id", // TODO: not deal with regex
      method: "GET",
      params: {
        id: "1",
      },
    });
    await mockCallMethod(app, ctx);

    assertEquals(callStack, [1]);
    callStack.length = 0;
  });

  await t.step("b", async () => {
    const ctx = createMockContext({
      path: "/b",
      method: "GET",
    });
    await mockCallMethod(app, ctx);

    assertEquals(callStack, [2]);
    callStack.length = 0;
  });
});

Deno.test("Req, Res, ControllerName, MethodName", async () => {
  const callStack: number[] = [];
  const ctx = createMockContext({
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

  const app = createMockApp();
  app.addController(A);

  await mockCallMethod(app, ctx);

  assertEquals(callStack, [1]);
});

Deno.test("Cookies", async () => {
  const callStack: number[] = [];
  const mockedCookie = {
    a: "b",
    c: "4",
  };
  const ctx = createMockContext({
    path: "/a",
    method: "GET",
    reqHeaders: {
      Cookie: "a=b; c=4;",
    },
    cookies: mockedCookie,
  });

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
      assertEquals(cookie, mockedCookie);
      assertEquals(await cookie["a"], "b");
      assertEquals(await cookie["c"], "4");
      assertEquals(a, "b");
      assertEquals(c, "4");
      assertEquals(c1, 4);
      assert(typeof c1 === "number");
      assert(!d);
    }
  }

  const app = createMockApp();
  app.addController(A);
  await mockCallMethod(app, ctx);

  assertEquals(callStack, [1]);
  callStack.length = 0;
});

Deno.test("Headers", async () => {
  const callStack: number[] = [];
  const mockedHeaders = {
    a: "b",
    c: "4",
  };
  const ctx = createMockContext({
    path: "/a",
    method: "GET",
    reqHeaders: mockedHeaders,
  });

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
      assertEquals(headers, mockedHeaders);
      assertEquals(headers["a"], "b");
      assertEquals(a, "b");
      assertEquals<string>(c, "4");
      assertEquals<number>(c1, 4);
      assert(typeof c1 === "number");
    }
  }

  const app = createMockApp();
  app.addController(A);
  await mockCallMethod(app, ctx);

  assertEquals(callStack, [1]);
  callStack.length = 0;
});

Deno.test("UploadedFile form data", async (t) => {
  const callStack: number[] = [];
  const fileMockData = new FormData();
  fileMockData.set("test", "a");
  fileMockData.set("file", new File(["hello"], "b.md"));

  @Controller("")
  class A {
    @Post("a")
    noUpload(@UploadedFile() body: FormData) {
      callStack.push(1);
      assert(body instanceof FormData, "will pass body");
      assertEquals(body.keys.length, 0, "no upload data will not pass body");
    }

    @Post("b")
    upload(@UploadedFile() body: any) {
      callStack.push(2);
      assertEquals(body, fileMockData, "will pass body");
    }
  }

  const app = createMockApp();
  app.addController(A);

  await t.step("not upload", async () => {
    const ctx = createMockContext({
      path: "/a",
      method: "POST",
      body: {
        type: "form-data",
        value: fileMockData,
      },
    });

    await mockCallMethod(app, ctx);

    assertEquals(callStack, [1]);

    callStack.length = 0;
  });

  await t.step("upload", async () => {
    const ctx = createMockContext({
      path: "/b",
      method: "POST",
      body: {
        type: "form-data",
        value: Promise.resolve(fileMockData),
      },
    });
    await mockCallMethod(app, ctx);

    assertEquals(callStack, [2]);
    callStack.length = 0;
  });
});

Deno.test("transAndValidateByCls", async (t) => {
  await t.step("not trans", async () => {
    class A {
      @IsNumber()
      age: number;
    }
    try {
      await transAndValidateByCls(A, {
        age: "12",
      });
      assert(false, "should not reach here");
    } catch (error) {
      assertEquals(
        error.message,
        "age must be a number conforming to the specified constraints",
      );
    }
  });

  await t.step("trans", async () => {
    enum Status {
      Open,
      Closed,
    }
    class A {
      @IsNumber()
      @Property()
      age: number;

      @IsEnum(Status)
      @IsOptional()
      @Property()
      status?: number;
    }
    const result = await transAndValidateByCls(A, {
      age: "12",
      status: "1",
    });
    assert(typeof result.status === "number");
    assert(typeof result.age === "number");
    assertEquals(result, {
      age: 12,
      status: 1,
    });

    try {
      await transAndValidateByCls(A, {
        age: "12",
        status: "3",
      });
      assert(false, "should not reach here");
    } catch (error) {
      assertEquals(
        error.message,
        "status must be a valid enum value",
      );
    }
  });
});

Deno.test("ip and host", async (t) => {
  const callStack: number[] = [];
  const mockedIP = "102.10.1.1";
  const mockedHost = "baidu.com";

  @Controller("")
  class A {
    @Get("/a")
    test(@Ip() ip: string) {
      callStack.push(1);
      assertEquals(ip, mockedIP);
    }

    @Get("/b")
    host(@Host() host: string) {
      callStack.push(2);
      assertEquals(host, mockedHost);
    }
  }

  const app = createMockApp();
  app.addController(A);

  await t.step("ip", async () => {
    const ctx = createMockContext({
      path: "/a",
      method: "GET",
      reqHeaders: {
        "x-forwarded-for": mockedIP,
      },
    });

    await mockCallMethod(app, ctx);

    assertEquals(callStack, [1]);

    callStack.length = 0;
  });

  await t.step("host", async () => {
    const ctx = createMockContext({
      path: "/b",
      method: "GET",
      reqHeaders: {
        host: mockedHost,
      },
    });

    await mockCallMethod(app, ctx);

    assertEquals(callStack, [2]);

    callStack.length = 0;
  });
});

Deno.test("form", async (t) => {
  const callStack: number[] = [];
  const mockedData = new FormData();
  mockedData.set("a", "b");
  mockedData.set("c", "true");
  mockedData.set("d", "true");
  mockedData.set("e", "1");

  class Dto {
    a: string;

    @Property()
    c: boolean;

    d: boolean;

    @Property()
    e: number;
  }

  @Controller("")
  class A {
    @Post("/a")
    test(@Form() form: Dto) {
      callStack.push(1);
      assert(form instanceof Dto);
      assertEquals(form.a, "b");
      assertEquals(form.c, true);
      assert(typeof form.c === "boolean");

      assertEquals(form.d, true);
      assert(typeof form.d === "string");

      assertEquals(form.e, 1);
      assert(typeof form.e === "number");
    }
  }

  const app = createMockApp();
  app.addController(A);

  await t.step("only property can trans bool and number", async () => {
    const ctx = createMockContext({
      path: "/a",
      method: "POST",
      body: {
        type: "form-data",
        value: mockedData,
      },
    });

    await mockCallMethod(app, ctx);

    assertEquals(callStack, [1]);

    callStack.length = 0;
  });
});
