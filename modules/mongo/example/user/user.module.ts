import { Module } from "@nest";
import { UserController } from "./user.controller.ts";

@Module({
  controllers: [UserController],
})
export class UserModule {}
