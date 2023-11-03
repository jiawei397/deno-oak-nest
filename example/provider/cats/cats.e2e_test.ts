import { assertEquals, createTestingModule } from "@nest/tests";
import { CatsController } from "./cats.controller.ts";

Deno.test("e2e test cats", async (t) => {
  const moduleRef = createTestingModule({
    controllers: [CatsController],
  })
    .compile();
  const app = moduleRef.createNestApplication();
  await app.init();

  await t.step("findAll", async () => {
    const res = await fetch(`http://localhost:${app.port}/cats`);
    assertEquals(res.status, 200);
    assertEquals(await res.json(), []);
  });

  await app.close();
});
