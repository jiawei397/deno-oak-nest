import { Module } from "@nest/core";
import { AppController } from "./app.controller.ts";

@Module({
  controllers: [AppController],
})
export class AppModule {}
