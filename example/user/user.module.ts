import { Module } from "../../mod.ts";
import { RoleController } from "./controllers/role.controller.ts";
import { UserController } from "./controllers/user.controller.ts";
import { User2Controller } from "./controllers/user2.controller.ts";

@Module({
  imports: [],
  controllers: [
    UserController,
    RoleController,
    User2Controller,
  ],
})
export class UserModule {
}
