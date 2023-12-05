import { Module } from "@nest";
import { AuthModule } from "./auth/auth.module.ts";
import { AppController } from "./app.controller.ts";

@Module({
  imports: [AuthModule],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
