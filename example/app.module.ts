import { Module, ScheduleModule } from "../mod.ts";
import { AppController } from "./app.controller.ts";
import { AsyncModule } from "./asyncModule/async.module.ts";
import { UserModule } from "./user/user.module.ts";

@Module({
  imports: [
    // ScheduleModule.forRoot(),
    UserModule,
    AsyncModule.register("localhost:4878"),
  ],
  controllers: [AppController],
})
export class AppModule {}
