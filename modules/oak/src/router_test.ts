import { assertEquals } from "../../../tests/test_deps.ts";
import { OakRouter } from "./router.ts";

Deno.test("OakRouter startServer error", async (t) => {
  const router = new OakRouter();
  // deno-lint-ignore no-explicit-any
  const app = (router as any).app;
  // deno-lint-ignore require-await
  app.listen = async () => {
    throw new Error("listen");
  };

  await t.step("with onError", async () => {
    const callStacks: number[] = [];

    await router.startServer({
      onListen: () => {
        callStacks.push(1);
      },
      onError(err) {
        callStacks.push(2);
        assertEquals((err as Error).message, "listen");
        return new Response();
      },
    });

    assertEquals(callStacks, [1, 2]);
  });

  await t.step("without onError", async () => {
    const callStacks: number[] = [];

    await router.startServer({
      onListen: () => {
        callStacks.push(1);
      },
    });

    assertEquals(callStacks, [1]);
  });
});
