// deno-lint-ignore-file no-explicit-any no-unused-vars
import {
  Body,
  type Context,
  Controller,
  Delete,
  Get,
  ModuleType,
  NestFactory,
  Patch,
  Post,
  Put,
} from "@nest";
import { HonoRouter } from "@nest/hono";
import { Module } from "@nest";
import { Max, Min } from "class_validator";
import { assertEquals, delay } from "../../../test_deps.ts";
import { findUnusedPort } from "../../../tests/common_helper.ts";

async function createApp(module: ModuleType, apiPrefix?: string) {
  const app = await NestFactory.create(module, HonoRouter);
  const port = await findUnusedPort(8000);
  if (apiPrefix) {
    app.setGlobalPrefix(apiPrefix);
  }
  app.listen({ port });
  await delay(100);
  const baseUrl = `http://localhost:${port}`;
  return { app, port, baseUrl };
}

Deno.test("fetch 404", async (t) => {
  @Module({})
  class AppModule {}
  const { app, baseUrl } = await createApp(AppModule);

  await t.step("fetch 404", async () => {
    const res = await fetch(baseUrl);
    assertEquals(res.status, 404);
    res.body?.cancel();
  });

  // last
  await app.close();
});

Deno.test("fetch success", async (t) => {
  await t.step("fetch ok with global prefix", async (it) => {
    @Controller("/")
    class A {
      @Get("/")
      get() {
        return "hello world";
      }

      @Get("/b")
      b(context: Context) {
        context.response.body = "b";
      }
    }

    @Module({
      controllers: [A],
    })
    class AppModule {}

    const { app, baseUrl } = await createApp(AppModule, "/api");

    await it.step("return result", async () => {
      const res = await fetch(`${baseUrl}/api`);
      assertEquals(res.status, 200);
      assertEquals(await res.text(), "hello world");
    });

    await it.step("change response body", async () => {
      const res = await fetch(`${baseUrl}/api/b`);
      assertEquals(res.status, 200);
      assertEquals(await res.text(), "b");
    });

    await app.close();
  });

  await t.step("fetch error", async () => {
    @Controller("/")
    class A {
      @Get("/")
      error() {
        throw new Error("error");
      }
    }

    @Module({
      controllers: [A],
    })
    class AppModule {}

    const { app, baseUrl } = await createApp(AppModule, "/api");

    const res = await fetch(`${baseUrl}/api`);
    assertEquals(res.status, 500);
    assertEquals(await res.json(), {
      "statusCode": 500,
      "message": "error",
      "error": "Internal Server Error",
    });

    await app.close();
  });
});

Deno.test("method tests", async (t) => {
  const callStack: number[] = [];
  const data = { a: 1 };

  @Controller("/")
  class A {
    @Post("/")
    post(@Body() body: any) {
      callStack.push(1);
      assertEquals(body, data);
      return "hello world";
    }

    @Put("/")
    put(@Body() body: any) {
      callStack.push(2);
      assertEquals(body, data);
      return "hello world";
    }

    @Delete("/")
    del() {
      callStack.push(3);
      return "hello world";
    }

    @Patch("/")
    patch() {
      callStack.push(4);
      return "hello world";
    }
  }

  @Module({
    controllers: [A],
  })
  class AppModule {}

  const { app, baseUrl } = await createApp(AppModule);

  await t.step("post", async () => {
    const res = await fetch(`${baseUrl}/`, {
      method: "POST",
      body: JSON.stringify(data),
      headers: {
        "Content-Type": "application/json",
      },
    });
    assertEquals(res.status, 200);
    assertEquals(await res.text(), "hello world");
    assertEquals(callStack, [1]);
    callStack.length = 0;
  });

  await t.step("put", async () => {
    const res = await fetch(`${baseUrl}/`, {
      method: "PUT",
      body: JSON.stringify(data),
      headers: {
        "Content-Type": "application/json",
      },
    });
    assertEquals(res.status, 200);
    assertEquals(await res.text(), "hello world");
    assertEquals(callStack, [2]);
    callStack.length = 0;
  });

  await t.step("delete", async () => {
    const res = await fetch(`${baseUrl}/`, {
      method: "DELETE",
    });
    assertEquals(res.status, 200);
    assertEquals(await res.text(), "hello world");
    assertEquals(callStack, [3]);
    callStack.length = 0;
  });

  await t.step("patch", async () => {
    const res = await fetch(`${baseUrl}/`, {
      method: "PATCH",
    });
    assertEquals(res.status, 200);
    assertEquals(await res.text(), "hello world");
    assertEquals(callStack, [4]);
    callStack.length = 0;
  });

  // last
  await app.close();
});

Deno.test("body validate", async (t) => {
  const callStack: number[] = [];
  const data = { a: 1 };

  class Dto {
    @Max(5)
    @Min(1)
    a: number;
  }

  @Controller("/")
  class A {
    @Post("/")
    post(@Body() body: Dto) {
      callStack.push(1);
      assertEquals(body, data);
      return "hello world";
    }
  }

  @Module({
    controllers: [A],
  })
  class AppModule {}

  const { app, baseUrl } = await createApp(AppModule);

  await t.step("success", async () => {
    const res = await fetch(`${baseUrl}/`, {
      method: "POST",
      body: JSON.stringify(data),
      headers: {
        "Content-Type": "application/json",
      },
    });
    assertEquals(res.status, 200);
    assertEquals(await res.text(), "hello world");
    assertEquals(callStack, [1]);
    callStack.length = 0;
  });

  await t.step("invalid", async () => {
    const res = await fetch(`${baseUrl}/`, {
      method: "POST",
      body: JSON.stringify({ a: 20 }),
      headers: {
        "Content-Type": "application/json",
      },
    });
    assertEquals(res.status, 400);
    res.body?.cancel();
    assertEquals(callStack, []);
  });

  await t.step("invalid 2", async () => {
    const res = await fetch(`${baseUrl}/`, {
      method: "POST",
      body: JSON.stringify({}),
      headers: {
        "Content-Type": "application/json",
      },
    });
    assertEquals(res.status, 400);
    res.body?.cancel();
    assertEquals(callStack, []);
  });

  // last
  await app.close();
});

Deno.test("use middleware", async (t) => {
  @Module({})
  class AppModule {}

  await t.step("middleware normal", async () => {
    const app = await NestFactory.create(AppModule, HonoRouter);
    const callStack: number[] = [];
    app.use(async (req, res, next) => {
      callStack.push(1);
      await next();
      callStack.push(2);
      assertEquals(res.status, 404);
    });

    const port = await findUnusedPort(8000);
    app.listen({ port });
    await delay(100);

    const res = await fetch(`http://localhost:${port}`);
    assertEquals(res.status, 404);
    res.body?.cancel();
    assertEquals(callStack, [1, 2]);
    callStack.length = 0;
    await app.close();
  });

  await t.step("middleware with error", async () => {
    const app = await NestFactory.create(AppModule, HonoRouter);
    const callStack: number[] = [];
    app.use(async (req, res, next) => {
      callStack.push(1);
      await next();
      callStack.push(2);
    });
    app.get("/", () => {
      throw new Error("error");
    });
    const port = await findUnusedPort(8000);
    app.listen({ port });

    // test start
    addEventListener("error", (event) => {
      event.preventDefault();
      callStack.push(3);
    });

    addEventListener("unhandledrejection", (event) => {
      event.preventDefault();
      callStack.push(4);
    });

    const res = await fetch(`http://localhost:${port}`);
    assertEquals(res.status, 500);
    assertEquals(await res.text(), "Internal Server Error");
    assertEquals(callStack, [1, 2]);

    // last
    callStack.length = 0;
    await app.close();
  });
});
