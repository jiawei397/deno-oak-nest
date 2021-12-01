import { Module } from "../mod.ts";
import { AppController } from "./app.controller.ts";
import { UserModule } from "./user/user.module.ts";

@Module({
  imports: [
    UserModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
