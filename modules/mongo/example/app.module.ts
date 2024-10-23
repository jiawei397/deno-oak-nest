import { Module } from "@nest/core";
import { MongoModule } from "@nest/mongo";
import { UserModule } from "./user/user.module.ts";

@Module({
  imports: [
    MongoModule.forRoot("mongodb://10.100.30.65:27018/test"),
    UserModule,
  ],
  controllers: [],
})
export class AppModule {}
