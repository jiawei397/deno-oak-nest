import {
  Controller,
  Get,
  Module,
  NestFactory,
  Res,
  type Response,
} from "@nest";
import { CORS } from "https://deno.land/x/oak_cors@v0.1.1/mod.ts";
import { Router } from "../mod.ts";
import { createCommonTests } from "../../../tests/app_helper.ts";
import { findUnusedPort } from "../../../tests/common_helper.ts";
import { assertEquals, assertThrows } from "../../../tests/test_deps.ts";
import { type OakContext } from "../deps.ts";

createCommonTests(Router, "oak");

Deno.test("oak - useOriginMiddleware", {
  sanitizeOps: false,
  sanitizeResources: false,
}, async (t) => {
  @Module({})
  class AppModule {}

  const app = await NestFactory.create(AppModule, Router);
  app.get("/", (_req, res) => {
    res.body = "Hello World!";
  });

  await t.step("should success", async () => {
    app.useOriginMiddleware(CORS());

    const port = await findUnusedPort(8000);
    await app.listen({ port });

    const res = await fetch(`http://localhost:${port}/`);
    assertEquals(res.status, 200);
    assertEquals(await res.text(), "Hello World!");
    assertEquals(res.headers.get("access-control-allow-credentials"), "true");
    assertEquals(res.headers.get("vary"), "Accept-Encoding, Origin");

    await app.close();
  });

  await t.step("oak not support path", () => {
    assertThrows(() => app.useOriginMiddleware(CORS(), "/api"));
  });
});

Deno.test("oak - useOriginContext", {
  sanitizeOps: false,
  sanitizeResources: false,
}, async (t) => {
  await t.step(
    "app.get should ok",
    async () => {
      @Module({})
      class AppModule {}

      const app = await NestFactory.create(AppModule, Router);

      app.get("/", (_req, res) => {
        const context = res.getOriginalContext<OakContext>();
        context.response.body = "Hello World!";
      });

      const port = await findUnusedPort(8000);
      await app.listen({ port });

      const res = await fetch(`http://localhost:${port}/`);
      assertEquals(res.status, 200);
      assertEquals(await res.text(), "Hello World!");

      await app.close();
    },
  );

  await t.step("controller should ok", async () => {
    @Controller("/")
    class A {
      @Get("/")
      get(@Res() res: Response) {
        const context = res.getOriginalContext<OakContext>();
        context.response.body = "Hello World!";
      }
    }

    @Module({
      controllers: [A],
    })
    class AppModule {}

    const app = await NestFactory.create(AppModule, Router);

    const port = await findUnusedPort(8000);
    await app.listen({ port });

    const res = await fetch(`http://localhost:${port}/`);
    assertEquals(res.status, 200);
    assertEquals(await res.text(), "Hello World!");

    await app.close();
  });
});
