import { Module } from "@nest";
import { CatsController } from "./cats.controller.ts";

// import { ConfigModule } from "../config/config.module.ts";

@Module({
  imports: [],
  // imports: [ConfigModule],
  controllers: [CatsController],
  providers: [],
})
export class CatsModule {}
