import { assert, assertEquals, assertRejects } from "../../test_deps.ts";
import { Controller, Get, Header, HeaderJSON, HttpCode } from "./controller.ts";
import {
  createMockApp,
  createMockContext,
  mockCallMethod,
} from "../../tests/common_helper.ts";

Deno.test("HttpCode", async (t) => {
  const callStack: number[] = [];
  @Controller("")
  class A {
    @Get("/a")
    @HttpCode(201)
    index() {
      callStack.push(1);
      return "test";
    }
  }

  const app = createMockApp();
  app.addController(A);

  await t.step("http code should success", async () => {
    const ctx = createMockContext({
      path: "/a",
      method: "GET",
    });

    await mockCallMethod(app, ctx);
    assertEquals(ctx.response.status, 201);
    assertEquals(ctx.response.body, "test");

    assertEquals(callStack, [1]);

    callStack.length = 0;
  });
});

Deno.test("Header decorator", async (t) => {
  const callStack: number[] = [];
  @Controller("")
  class A {
    @Get("/a")
    @Header("x-test", "test")
    index() {
      callStack.push(1);
      return "test";
    }

    @Get("/b")
    @HeaderJSON()
    json() {
      callStack.push(2);
      return true;
    }

    @Get("/c")
    bool() {
      callStack.push(3);
      return true;
    }
  }

  const app = createMockApp();
  app.addController(A);

  await t.step("header set self", async () => {
    const ctx = createMockContext({
      path: "/a",
      method: "GET",
    });

    await mockCallMethod(app, ctx);
    assertEquals(ctx.response.status, 200);
    assertEquals(ctx.response.body, "test");
    assertEquals(ctx.response.headers.get("x-test"), "test");

    assertEquals(callStack, [1]);

    callStack.length = 0;
  });

  await t.step("header set json", async () => {
    const ctx = createMockContext({
      path: "/b",
      method: "GET",
    });

    await mockCallMethod(app, ctx);
    assertEquals(ctx.response.status, 200);
    assertEquals(ctx.response.body, true);
    assert(
      ctx.response.headers.get("content-type")?.includes("application/json"),
    );

    assertEquals(callStack, [2]);

    callStack.length = 0;
  });

  await t.step("header no json set", async () => {
    const ctx = createMockContext({
      path: "/c",
      method: "GET",
    });

    await mockCallMethod(app, ctx);
    assertEquals(ctx.response.status, 200);
    assertEquals(ctx.response.body, true);
    const contentType = ctx.response.headers.get("content-type");
    assert(!contentType);

    assertEquals(callStack, [3]);

    callStack.length = 0;
  });
});

Deno.test("Controller method with alias", async (t) => {
  const callStack: number[] = [];
  @Controller("")
  class A {
    @Get("/a", { alias: "/b" })
    a() {
      callStack.push(1);
      return "a";
    }

    @Get("/c", { alias: "/v1/c", isAbsolute: true })
    c() {
      callStack.push(2);
      return "c";
    }
  }

  const app = createMockApp();
  app.addController(A);

  await t.step("fetch /a", async () => {
    const ctx = createMockContext({
      path: "/a",
      method: "GET",
    });

    await mockCallMethod(app, ctx);
    assertEquals(ctx.response.status, 200);
    assertEquals(ctx.response.body, "a");

    assertEquals(callStack, [1]);

    callStack.length = 0;
  });

  await t.step("fetch /b", async () => {
    const ctx = createMockContext({
      path: "/b",
      method: "GET",
    });

    await mockCallMethod(app, ctx);
    assertEquals(ctx.response.status, 200);
    assertEquals(ctx.response.body, "a");

    assertEquals(callStack, [1]);

    callStack.length = 0;
  });

  await t.step("fetch /c", async () => {
    const ctx = createMockContext({
      path: "/c",
      method: "GET",
    });

    await mockCallMethod(app, ctx);
    assertEquals(ctx.response.status, 200);
    assertEquals(ctx.response.body, "c");

    assertEquals(callStack, [2]);

    callStack.length = 0;
  });

  await t.step("fetch /v1/c", async () => {
    const ctx = createMockContext({
      path: "/v1/c",
      method: "GET",
    });

    await mockCallMethod(app, ctx);
    assertEquals(ctx.response.status, 200);
    assertEquals(ctx.response.body, "c");

    assertEquals(callStack, [2]);

    callStack.length = 0;
  });
});

Deno.test("controller alias", async (t) => {
  const callStack: number[] = [];
  @Controller("/user", { alias: "/v1" })
  class A {
    @Get("/a")
    a() {
      callStack.push(1);
      return "a";
    }

    @Get("/b", {
      alias: "/v2/b",
    })
    b() {
      callStack.push(2);
      return "b";
    }
  }

  const app = createMockApp();
  app.addController(A);

  await t.step("fetch /user/a", async () => {
    const ctx = createMockContext({
      path: "/user/a",
      method: "GET",
    });

    await mockCallMethod(app, ctx);
    assertEquals(ctx.response.status, 200);
    assertEquals(ctx.response.body, "a");

    assertEquals(callStack, [1]);

    callStack.length = 0;
  });

  await t.step("fetch /v1/a", async () => {
    const ctx = createMockContext({
      path: "/v1/a",
      method: "GET",
    });

    await mockCallMethod(app, ctx);
    assertEquals(ctx.response.status, 200);
    assertEquals(ctx.response.body, "a");

    assertEquals(callStack, [1]);

    callStack.length = 0;
  });

  await t.step("fetch /user/b", async () => {
    const ctx = createMockContext({
      path: "/user/b",
      method: "GET",
    });

    await mockCallMethod(app, ctx);
    assertEquals(ctx.response.status, 200);
    assertEquals(ctx.response.body, "b");
    assertEquals(callStack, [2]);

    callStack.length = 0;
  });

  await t.step(
    "fetch /v2/b, when Controller has alias, the method alias will be absolute",
    async () => {
      const ctx = createMockContext({
        path: "/v2/b",
        method: "GET",
      });

      await mockCallMethod(app, ctx);
      assertEquals(ctx.response.status, 200);
      assertEquals(ctx.response.body, "b");

      assertEquals(callStack, [2]);

      callStack.length = 0;
    },
  );

  await t.step("fetch /user/v2/b", async () => {
    const ctx = createMockContext({
      path: "/user/v2/b",
      method: "GET",
    });

    await assertRejects(() => mockCallMethod(app, ctx));

    assertEquals(callStack, []);
  });
});
