// deno-lint-ignore-file no-unused-vars
import { Module } from "@nest/core";
import { CatsController } from "./cats/cats.controller.ts";
import { CatsService } from "./cats/cats.service.ts";
import { Cat } from "./cats/cats.interface.ts";
import { connection } from "../src/connection.ts";

const mockCatsService = {
  findAll(): Cat[] {
    console.log("----mocked findAll----");
    return [{ name: "mocked", age: 0, breed: "mocked" }];
  },
};

@Module({
  controllers: [CatsController],
  providers: [
    // {
    //   provide: CatsService,
    //   useValue: mockCatsService,
    // },
    {
      provide: "CONNECTION",
      useValue: connection,
    },
  ],
})
export class AppModule {}
