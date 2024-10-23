import { Module } from "@nest/core";
import { ROLE_KEY } from "./roles.constant.ts";
import { RolesService } from "./roles.service.ts";
import { RolesController } from "./roles.controller.ts";
import { Global } from "../../../../src/decorators/module.ts";

@Global()
@Module({
  controllers: [RolesController],
  providers: [
    {
      provide: ROLE_KEY,
      useValue: "admin",
    },
    RolesService,
  ],
  exports: [RolesService],
})
export class RolesModule {}
