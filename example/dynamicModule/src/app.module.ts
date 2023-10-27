import { Module } from "@nest";
import { ConfigModule } from "./config/config.module.ts";
import { AppController } from "./app.controller.ts";

@Module({
  imports: [ConfigModule.register({ folder: "./config" })],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
