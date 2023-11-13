import { Module } from "@nest";
import { AppController } from "./app.controller.ts";

@Module({
  controllers: [AppController],
})
export class AppModule {}
