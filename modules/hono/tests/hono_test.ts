import { HonoRouter } from "@nest/hono";
import { createCommonTests } from "../../../tests/app_helper.ts";
import { assert, Module, NestFactory } from "@nest";
import { etag } from "../deps.ts";
import { findUnusedPort } from "../../../tests/common_helper.ts";
import { assertEquals } from "../../../tests/test_deps.ts";

createCommonTests(HonoRouter, "hono");

Deno.test("hono - useOriginMiddleware", {
  sanitizeOps: false,
  sanitizeResources: false,
}, async (t) => {
  @Module({})
  class AppModule {}

  await t.step(
    "not work with app.get, because it order should be ok",
    async () => {
      const app = await NestFactory.create(AppModule, HonoRouter);

      app.get("/", (_req, res) => {
        res.body = "Hello World!";
      });
      app.useOriginMiddleware(etag({ weak: true }));

      const port = await findUnusedPort(8000);
      await app.listen({ port });

      const res = await fetch(`http://localhost:${port}/`);
      assertEquals(res.status, 200);
      assertEquals(await res.text(), "Hello World!");
      assertEquals(res.headers.get("etag"), null);

      await app.close();
    },
  );

  await t.step("work with app.get", async () => {
    const app = await NestFactory.create(AppModule, HonoRouter);
    app.useOriginMiddleware(etag({ weak: true }));

    app.get("/", (_req, res) => {
      res.body = "Hello World!";
    });

    const port = await findUnusedPort(8000);
    await app.listen({ port });

    const res = await fetch(`http://localhost:${port}/`);
    assertEquals(res.status, 200);
    assertEquals(await res.text(), "Hello World!");
    assert(res.headers.get("etag"));

    await app.close();
  });

  await t.step(
    "also work when etag default",
    async () => {
      const app = await NestFactory.create(AppModule, HonoRouter);
      app.useOriginMiddleware(etag());

      app.get("/", (_req, res) => {
        res.body = "Hello World!";
      });

      const port = await findUnusedPort(8000);
      await app.listen({ port });

      const res = await fetch(`http://localhost:${port}/`);
      assertEquals(res.status, 200);
      assertEquals(await res.text(), "Hello World!");
      assert(res.headers.get("etag"));

      await app.close();
    },
  );

  await t.step(
    "also work when etag set weak false",
    async () => {
      const app = await NestFactory.create(AppModule, HonoRouter);
      app.useOriginMiddleware(etag({ weak: false }));

      app.get("/", (_req, res) => {
        res.body = "Hello World!";
      });

      const port = await findUnusedPort(8000);
      await app.listen({ port });

      const res = await fetch(`http://localhost:${port}/`);
      assertEquals(res.status, 200);
      assertEquals(await res.text(), "Hello World!");
      assert(res.headers.get("etag"));

      await app.close();
    },
  );
});
