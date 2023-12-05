import { Module } from "@nest";
import { AuthController } from "./auth.controller.ts";
import { UsersModule } from "../users/users.module.ts";

@Module({
  imports: [UsersModule],
  controllers: [AuthController],
})
export class AuthModule {}
