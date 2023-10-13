import { Module, OnModuleInit } from "@nest";
import { AppController } from "./app.controller.ts";

@Module({
  imports: [],
  controllers: [AppController],
})
export class AppModule implements OnModuleInit {
  onModuleInit() {
    console.log("onModuleInit AppModule");
  }
}
