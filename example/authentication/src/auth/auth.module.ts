import { APP_GUARD, Module } from "@nest";
import { JwtModule } from "@nest/jwt";

import { AuthController } from "./auth.controller.ts";
import { UsersModule } from "../users/users.module.ts";
import { jwtConstants } from "./auth.constants.ts";
import { AuthGuard } from "./auth.guard.ts";

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
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
})
export class AuthModule {}
