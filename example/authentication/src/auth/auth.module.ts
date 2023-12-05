import { Module } from "@nest";
import { AuthController } from "./auth.controller.ts";
import { UsersModule } from "../users/users.module.ts";
import { JwtModule } from "@nest/jwt";
import { jwtConstants } from "./auth.constants.ts";

@Module({
  imports: [
    JwtModule.register({
      global: true,
      secret: jwtConstants.secret,
      signOptions: {
        expiresIn: 600,
      },
    }),
    UsersModule,
  ],
  controllers: [AuthController],
})
export class AuthModule {}
