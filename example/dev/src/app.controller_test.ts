import { assert, assertEquals, createTestingModule } from "@nest/tests";
import { UserService } from "./user/services/user.service.ts";
import { AppController } from "./app.controller.ts";

Deno.test("app test", async () => {
  const callStacks: number[] = [];
  const userService = {
    info() {
      callStacks.push(1);
    },
  };
  const moduleRef = await createTestingModule({
    controllers: [AppController],
  })
    .overrideProvider(UserService, userService)
    .compile();
  const appController = await moduleRef.get(AppController);
  assert(appController);
  assertEquals(await appController.version(), "0.0.1");
  assertEquals(callStacks, [1]);
});
