import { Module } from "../mod.ts";
import { AppController } from "./app.controller.ts";
import { AsyncModule } from "./asyncModule/async.module.ts";
import { UserModule } from "./user/user.module.ts";

@Module({
  imports: [
    UserModule,
    AsyncModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
