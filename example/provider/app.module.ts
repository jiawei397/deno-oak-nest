import { Module } from "@nest";
import { CatsController } from "./cats/cats.controller.ts";

@Module({
  controllers: [CatsController],
})
export class AppModule {}
