// deno-lint-ignore-file no-explicit-any
import {
  Controller,
  Delete,
  Patch,
  Post,
  Put,
} from "../src/decorators/controller.ts";
import { assertEquals, assertNotEquals, assertRejects } from "../test_deps.ts";
import {
  createMockApp,
  createMockContext,
  findUnusedPort,
  mockCallMethod,
  MockOptions,
} from "./common_helper.ts";
import type { Response } from "../src/interfaces/context.interface.ts";
import { Res } from "../src/decorators/method.ts";

Deno.test("findUnusedPort", async () => {
  const listener1 = Deno.listen({ port: 3000 });
  const port = await findUnusedPort(3000);
  assertNotEquals(port, 3000);
  listener1.close();
});

Deno.test("createMockContext - returns expected context object", async () => {
  const options: MockOptions = {
    path: "/test",
    method: "GET",
    body: {
      type: "json",
      value: { foo: "bar" },
    },
    reqHeaders: { "User-Agent": "test" },
    cookies: { sessionId: "123" },
    params: { id: "123" },
    queries: { search: "test", page: ["1", "2"] },
  };

  const ctx = createMockContext(options);

  assertEquals(ctx.request.method, options.method);
  assertEquals(ctx.request.url, `http://localhost${options.path}`);
  assertEquals(await ctx.request.json(), options.body?.value);
  assertEquals(await ctx.request.formData(), options.body?.value as any);
  assertEquals(await ctx.request.text(), options.body?.value as any);
  assertEquals(
    ctx.request.header("User-Agent"),
    options.reqHeaders?.["User-Agent"],
  );
  assertEquals(await ctx.request.cookies(), options.cookies);
  assertEquals(
    await ctx.request.cookie("sessionId"),
    options.cookies?.sessionId,
  );
  assertEquals(ctx.request.params(), options.params);
  assertEquals(ctx.request.param("id"), options.params?.id);
  assertEquals(ctx.request.queries("search"), [options.queries?.search]);
  assertEquals(ctx.request.queries("page"), options.queries?.page);
  assertEquals(ctx.request.queries("search2"), []);

  assertEquals(ctx.request.query("search2"), undefined);
  assertEquals(ctx.request.query("search"), options.queries?.search);
  assertEquals(ctx.request.query("page"), options.queries?.page[0]);
  assertEquals(ctx.response.body, options.body?.value);
  assertEquals(ctx.response.status, 200);
  assertEquals(ctx.response.statusText, "");
  assertEquals(ctx.render(), undefined, "not implement");
});

Deno.test("mockCallMethod", async (t) => {
  await t.step("mockCallMethod - GET request", async () => {
    const app = createMockApp();
    app.get("/", (_req, res) => {
      res.body = "Hello, world!";
    });

    const ctx = createMockContext({
      path: "/",
      method: "GET",
    });

    const result = await mockCallMethod(app, ctx);
    assertEquals(result, undefined);

    assertEquals(ctx.response.body, "Hello, world!");
  });

  await t.step("mockCallMethod - POST request", async () => {
    const app = createMockApp();

    @Controller("/")
    class A {
      @Post("/")
      index(@Res() res: Response) {
        res.body = "Hello, world!";
      }
    }
    app.addController(A);

    const ctx = createMockContext({
      path: "/",
      method: "POST",
    });

    const result = await mockCallMethod(app, ctx);
    assertEquals(result, undefined);

    assertEquals(ctx.response.body, "Hello, world!");
  });

  await t.step("mockCallMethod - patch", async () => {
    const app = createMockApp();

    @Controller("/")
    class A {
      @Patch("/")
      index(@Res() res: Response) {
        res.body = "Hello, world!";
      }
    }
    app.addController(A);

    const ctx = createMockContext({
      path: "/",
      method: "PATCH",
    });

    const result = await mockCallMethod(app, ctx);
    assertEquals(result, undefined);

    assertEquals(ctx.response.body, "Hello, world!");
  });

  await t.step("mockCallMethod - delete", async () => {
    const app = createMockApp();

    @Controller("/")
    class A {
      @Delete("/")
      index(@Res() res: Response) {
        res.body = "Hello, world!";
      }
    }
    app.addController(A);

    const ctx = createMockContext({
      path: "/",
      method: "DELETE",
    });

    const result = await mockCallMethod(app, ctx);
    assertEquals(result, undefined);

    assertEquals(ctx.response.body, "Hello, world!");
  });

  await t.step("mockCallMethod - put", async () => {
    const app = createMockApp();

    @Controller("/")
    class A {
      @Put("/")
      index(@Res() res: Response) {
        res.body = "Hello, world!";
      }
    }
    app.addController(A);

    const ctx = createMockContext({
      path: "/",
      method: "PUT",
    });

    const result = await mockCallMethod(app, ctx);
    assertEquals(result, undefined);

    assertEquals(ctx.response.body, "Hello, world!");
  });

  await t.step("mockCallMethod - 404", async () => {
    const app = createMockApp();

    const ctx = createMockContext({
      path: "/",
      method: "GET",
    });

    await assertRejects(() => mockCallMethod(app, ctx));
  });
});
