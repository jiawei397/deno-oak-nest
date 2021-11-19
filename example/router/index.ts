import { UserController } from "./controllers/user.controller.ts";
import { RoleController } from "./controllers/role.controller.ts";
import { User2Controller } from "./controllers/user2.controller.ts";

import { Context, Router } from "../../mod.ts";

const router = new Router();
router.add(UserController);
router.setGlobalPrefix("api");
router.add(RoleController, User2Controller);

const sleep = (time: number) => {
  return new Promise(
    (resolve) => {
      setTimeout(() => {
        resolve("app");
      }, time);
    },
  );
};

router.get("/", (context: Context) => {
  // context.response.status = 304;
  context.response.body = "haha";
});

router.get("/hello", (context: any) => {
  context.response.body = "hello";
});

router.get("/sleep", async (context: Context) => {
  await sleep(1000);
  context.response.body = "Hello Sleep";
});

// console.log(UserController.path);
// console.log(UserController.map);

export default router;
