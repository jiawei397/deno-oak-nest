import { Controller, Get } from "../mod.ts";
import { UserService } from "./user/services/user.service.ts";

@Controller("")
export class AppController {
  constructor(private readonly userService: UserService) {}
  @Get("/")
  version() {
    console.log(this.userService.info());
    return "0.0.1";
  }
}
