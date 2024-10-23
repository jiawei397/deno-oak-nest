import { Module } from "@nest/core";
import { UsersController } from "./users.controller.ts";

@Module({
  controllers: [UsersController],
})
export class UsersModule {}
