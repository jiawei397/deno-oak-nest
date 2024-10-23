import { Module } from "@nest/core";
import { UserController } from "./user.controller.ts";

@Module({
  controllers: [UserController],
})
export class UserModule {}
