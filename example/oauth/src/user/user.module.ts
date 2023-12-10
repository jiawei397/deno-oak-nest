import { Module } from "@nest";
import { JwtModule } from "@nest/jwt";
import config from "../globals.ts";
import { UserController } from "./user.controller.ts";

@Module({
  imports: [JwtModule.register({
    global: true,
    secret: config.jwtSecret,
    signOptions: {
      expiresIn: config.jwtExpiration,
    },
  })],
  controllers: [UserController],
})
export class UserModule {}
