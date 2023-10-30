import { assertEquals, assertRejects } from "../../test_deps.ts";
import { Controller, Get, Header, HttpCode, Redirect } from "./controller.ts";
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
});

Deno.test("redirect", async (t) => {
  const callStack: number[] = [];
  @Controller("")
  class A {
    @Get("/a")
    @Redirect("https://nestjs.com", 301)
    index() {
      callStack.push(1);
    }

    @Get("/b")
    @Redirect("https://nestjs.com")
    index2() {
      callStack.push(2);
    }
  }

  const app = createMockApp();
  app.addController(A);

  await t.step("status is 301", async () => {
    const ctx = createMockContext({
      path: "/a",
      method: "GET",
    });

    await mockCallMethod(app, ctx);
    assertEquals(ctx.response.status, 301);
    assertEquals(ctx.response.headers.get("Location"), "https://nestjs.com");

    assertEquals(callStack, [1]);

    callStack.length = 0;
  });

  await t.step("status is 302", async () => {
    const ctx = createMockContext({
      path: "/b",
      method: "GET",
    });

    await mockCallMethod(app, ctx);
    assertEquals(ctx.response.status, 302);
    assertEquals(ctx.response.headers.get("Location"), "https://nestjs.com");

    assertEquals(callStack, [2]);

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

    @Get("/c", { alias: "/v1/c" })
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
