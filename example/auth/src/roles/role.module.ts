import { Module } from "@nest";
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
