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
} from "../../tests/test_deps.ts";
import {
  createMockApp,
  createMockContext,
  mockCallMethod,
} from "../../tests/common_helper.ts";
import { Controller, Get, Post } from "./controller.ts";
import {
  Body,
  ControllerName,
  Cookie,
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
} from "./method.ts";
import { type ICookies } from "../interfaces/context.interface.ts";

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
    m: "aa,bb",
    n: "1,2",
    o: "true,false",
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

    @Property("string")
    m: string[];

    @Property("number")
    n: number[];

    @Property("boolean")
    o: boolean[];
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
      @Query("m") m: string[],
      @Query("n") n: number[],
      @Query("o") o: boolean[],
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
      assertEquals(m, ["aa", "bb"]);
      assert(Array.isArray(m));

      assertEquals(n, [1, 2]);
      assert(Array.isArray(n));
      n.forEach((item) => {
        assert(typeof item === "number");
      });

      assertEquals(o, [true, false]);
      assert(Array.isArray(o));
      o.forEach((item) => {
        assert(typeof item === "boolean");
      });

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
    testNoQuery(@Query() query: any) {
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
    testNoParam(@Params() params: any) {
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
      @Cookies() cookies: ICookies,
      @Cookie("a") a: string,
      @Cookie("c") c: string,
      @Cookie("c") c1: number,
      @Cookie("d") d: string,
    ) {
      callStack.push(1);
      assertEquals(await cookies.getAll(), mockedCookie);
      assertEquals(await cookies.get("a"), "b");
      assertEquals(await cookies.get("c"), "4");
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
      @Headers() headers: Headers,
      @Headers("a") a: string,
      @Headers("c") c: string,
      @Headers("c") c1: number,
    ) {
      callStack.push(1);
      assert(headers instanceof Headers);
      assertEquals(headers.get("a"), "b");
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
      assertEquals(error.message, "status must be a valid enum value");
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

  class Dto {
    a: string;

    @Property()
    c: boolean;

    d: boolean;

    @Property()
    e: number;

    f: string[];
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

      assertEquals(form.f, ["f1", "f2"]);
    }
  }

  const app = createMockApp();
  app.addController(A);

  await t.step("only property can trans bool and number", async () => {
    const mockedData = new FormData();
    mockedData.set("a", "b");
    mockedData.set("c", "true");
    mockedData.set("d", "true");
    mockedData.set("e", "1");
    mockedData.append("f", "f1");
    mockedData.append("f", "f2");

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

Deno.test("form not pass", async (t) => {
  const callStack: number[] = [];

  // deno-lint-ignore no-unused-vars
  class Dto {
    @IsString()
    a: string;

    @Property()
    @IsNumber()
    @Max(10)
    b: number;
  }

  @Controller("")
  class A {
    @Post("a")
    a(@Form() body: Dto) {
      callStack.push(1);
      return body;
    }

    @Post("b")
    b(@Form() body: any) {
      callStack.push(2);
      return body;
    }
  }

  const app = createMockApp();
  app.addController(A);

  await t.step("not pass", async () => {
    const fileMockData = new FormData();
    fileMockData.set("a", "a");
    fileMockData.set("b", "20");

    const ctx = createMockContext({
      path: "/a",
      method: "POST",
      body: {
        type: "form-data",
        value: fileMockData,
      },
    });
    await mockCallMethod(app, ctx);
    assertEquals(callStack, []);
    assertEquals(ctx.response.status, 400);

    callStack.length = 0;
  });

  await t.step("passed success", async () => {
    const fileMockData = new FormData();
    fileMockData.set("a", "a");
    fileMockData.set("b", "2");

    const ctx = createMockContext({
      path: "/a",
      method: "POST",
      body: {
        type: "form-data",
        value: Promise.resolve(fileMockData),
      },
    });
    await mockCallMethod(app, ctx);

    assertEquals(callStack, [1]);
    assertEquals(ctx.response.body, {
      a: "a",
      b: 2,
    });
    callStack.length = 0;
  });

  await t.step("not validate but pass", async () => {
    const fileMockData = new FormData();
    fileMockData.set("a", "a");
    fileMockData.set("b", "20");

    const ctx = createMockContext({
      path: "/b",
      method: "POST",
      body: {
        type: "form-data",
        value: fileMockData,
      },
    });
    await mockCallMethod(app, ctx);
    assertEquals(callStack, [2]);
    assertEquals(ctx.response.status, 200);
    assertEquals(ctx.response.body, {
      a: "a",
      b: "20",
    });

    callStack.length = 0;
  });
});

Deno.test("form with file", async (t) => {
  const callStack: number[] = [];

  interface Dto {
    a: string;
    file: File;
  }

  @Controller("")
  class A {
    @Post("a")
    a(@Form() body: Dto) {
      callStack.push(1);
      return body;
    }

    @Post("b")
    b(
      @Form({
        maxFileSize: 1,
      }) body: Dto,
    ) {
      callStack.push(2);
      return body;
    }
  }

  const app = createMockApp();
  app.addController(A);

  await t.step("valid parsed files", async () => {
    const fileMockData = new FormData();
    fileMockData.set("a", "a");
    fileMockData.set("file", new File(["test"], "test.txt"));

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
    assertEquals(ctx.response.status, 200);
    const body = ctx.response.body as Dto;
    assertEquals(body.a, "a");
    assertEquals(body.file.name, "test.txt");

    callStack.length = 0;
  });

  await t.step("file size too large", async () => {
    const fileMockData = new FormData();
    fileMockData.set("a", "a");
    fileMockData.set("file", new File(["test"], "test.txt"));

    const ctx = createMockContext({
      path: "/b",
      method: "POST",
      body: {
        type: "form-data",
        value: fileMockData,
      },
    });
    await mockCallMethod(app, ctx);
    assertEquals(callStack, []);
    assertEquals(ctx.response.status, 400);
    assertEquals(ctx.response.body, {
      statusCode: 400,
      message: "file size too large",
      error: "params not valid",
    });

    callStack.length = 0;
  });
});
