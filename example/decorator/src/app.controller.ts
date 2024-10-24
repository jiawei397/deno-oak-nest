import { Controller, Get, UseGuards } from "@nest/core";
import { AuthGuard } from "../src/auth.guard.ts";
import { User, type UserInfo } from "../src/decorators.ts";

@UseGuards(AuthGuard)
@Controller("")
export class AppController {
  @Get("/")
  findOne(@User() user: UserInfo) {
    return {
      data: user,
    };
  }
}
