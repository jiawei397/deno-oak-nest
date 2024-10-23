import { Module } from "@nest/core";
import { RoleService } from "./role.service.ts";

@Module({
  imports: [],
  providers: [{
    provide: "CONNECTION",
    useValue: "connected",
  }, RoleService],
  exports: [RoleService],
})
export class RoleModule {}
