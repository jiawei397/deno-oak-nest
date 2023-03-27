import { Module } from "./deps.ts";
import { AppController } from "./app.controller.ts";
import { MysqlModule } from "../mod.ts";

@Module({
  imports: [
    MysqlModule.forRoot({
      hostname: "localhost",
      username: "root",
      db: "test",
      poolSize: 3, // connection limit
      password: "yourpassword",
    }),
  ],
  controllers: [AppController],
})
export class AppModule {}
