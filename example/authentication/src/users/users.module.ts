import { Module } from "@nest/core";
import { UsersService } from "./users.service.ts";

@Module({
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
