import { UserController } from "./user.controller.ts";
import { RoleController } from "./role.controller.ts";
import { User2Controller } from "./user2.controller.ts";

import { Context, Router } from "../../mod.ts";

const router = new Router();
router.add(UserController);
router.setGlobalPrefix("api");
router.add(RoleController);
router.add(User2Controller);

const sleep = (time: number) => {
  return new Promise(
    ((resolve) => {
      setTimeout(() => {
        resolve("app");
      }, time);
    }),
  );
};

router.get("/", (context: Context) => {
  // context.response.status = 404;
  context.response.body = "haha";
  // return context.response.status(404).send('not find');
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
