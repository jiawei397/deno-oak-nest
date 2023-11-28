import { Module } from "@nest";
import { UsersController } from "./users.controller.ts";

@Module({
  controllers: [UsersController],
})
export class UsersModule {}
