import { Module } from "./deps.ts";
import { AppController } from "./app.controller.ts";
import { RedisModule } from "../mod.ts";

@Module({
  imports: [
    RedisModule.forRoot({
      port: 6379,
      hostname: "192.168.21.176",
      password: "123456",
    }),
  ],
  controllers: [AppController],
})
export class AppModule {}
