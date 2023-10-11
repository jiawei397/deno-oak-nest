import { Module } from "../../../mod.ts";
import { AppController } from "./app.controller.ts";

@Module({
  imports: [],
  controllers: [AppController],
})
export class AppModule {}
