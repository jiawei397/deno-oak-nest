import { Module } from "@nest";
import { AppController } from "./app.controller.ts";
import { CatsModule } from "./cats/cats.module.ts";

@Module({
  imports: [CatsModule],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
