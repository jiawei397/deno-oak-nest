import { Module } from "@nest";
import { AppController } from "./app.controller.ts";
import { RolesModule } from "./roles/roles.module.ts";
import { UsersModule } from "./users/users.module.ts";

@Module({
  imports: [RolesModule, UsersModule],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
