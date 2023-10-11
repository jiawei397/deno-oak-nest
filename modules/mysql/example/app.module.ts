import { Module } from "@nest";
import { MysqlModule } from "@nest/mysql";
import { AppController } from "./app.controller.ts";

@Module({
  imports: [
    MysqlModule.forRoot({
      hostname: "localhost",
      username: "root",
      port: 3306,
      db: "test",
      poolSize: 3, // connection limit
      password: "123456",
    }),
  ],
  controllers: [AppController],
})
export class AppModule {}
