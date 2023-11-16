import { Module } from "@nest";
import { AppController } from "./app.controller.ts";
import { UserController } from "./user.controller.v1.ts";
import { UserControllerV2 } from "./user.controller.v2.ts";

@Module({
  controllers: [AppController, UserController, UserControllerV2],
})
export class AppModule {}
