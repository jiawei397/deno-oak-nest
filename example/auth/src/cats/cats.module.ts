import { Module } from "@nest/core";
import { CatsController } from "./cats.controller.ts";
import { RoleModule } from "../roles/role.module.ts";

@Module({
  imports: [RoleModule],
  controllers: [CatsController],
  providers: [],
})
export class CatsModule {}
