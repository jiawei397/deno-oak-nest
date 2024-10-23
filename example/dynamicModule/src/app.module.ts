import { Module } from "@nest/core";
import { ConfigModule } from "./config/config.module.ts";
import { AppController } from "./app.controller.ts";

import { CatsModule } from "./cats/cats.module.ts";

@Module({
  imports: [ConfigModule.register({ folder: "./config" }), CatsModule],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
