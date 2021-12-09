import { Module } from "../../mod.ts";
import { RoleController } from "./controllers/role.controller.ts";
import { UserController } from "./controllers/user.controller.ts";
import { User2Controller } from "./controllers/user2.controller.ts";
import { ScheduleService } from "./services/schedule.service.ts";

@Module({
  imports: [],
  controllers: [
    UserController,
    RoleController,
    User2Controller,
  ],
  providers: [
    ScheduleService,
  ],
})
export class UserModule {
}
