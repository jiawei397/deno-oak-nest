import { Module, NestFactory } from "@nest";
import { OakRouter } from "@nest/oak";
import { CORS } from "https://deno.land/x/oak_cors@v0.1.1/mod.ts";
import { createCommonTests } from "../../../tests/app_helper.ts";
import { findUnusedPort } from "../../../tests/common_helper.ts";
import { assertEquals, assertThrows } from "../../../test_deps.ts";

createCommonTests(OakRouter, "oak");

Deno.test("oak - useOriginMiddleware", {
  sanitizeOps: false,
  sanitizeResources: false,
}, async (t) => {
  @Module({})
  class AppModule {}

  const app = await NestFactory.create(AppModule, OakRouter);
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
