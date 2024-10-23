import { Module } from "@nest/core";
import { AppController } from "./app.controller.ts";
import { UserModule } from "./user/user.module.ts";

@Module({
  imports: [UserModule],
  controllers: [AppController],
})
export class AppModule {}
