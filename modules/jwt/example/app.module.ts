import { Module } from "@nest/core";
import { AppController } from "./app.controller.ts";
import { JwtModule } from "@nest/jwt";

@Module({
  imports: [JwtModule.register({
    global: true,
    secret:
      "DO NOT USE THIS VALUE. INSTEAD, CREATE A COMPLEX SECRET AND KEEP IT SAFE OUTSIDE OF THE SOURCE CODE.",
    signOptions: {
      expiresIn: 60,
    },
  })],
  controllers: [AppController],
})
export class AppModule {}
