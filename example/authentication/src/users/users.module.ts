import { Module } from "@nest";
import { UsersService } from "./users.service.ts";

@Module({
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
