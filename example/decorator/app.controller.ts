import { Controller, Get, UseGuards } from "@nest";
import { AuthGuard } from "./auth.guard.ts";
import { User, type UserInfo } from "./decorators.ts";

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
