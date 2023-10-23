import { type Context, Controller, Get } from "@nest";
import { UserService } from "../services/user.service.ts";

@Controller("v1/user", {
  // isAbsolute: true,
})
export class User2Controller {
  constructor(
    private readonly userService: UserService,
  ) {
  }
  @Get("/info")
  info(context: Context) {
    context.response.body = this.userService.info();
  }

  @Get("/info2", {
    // alias: "/v1/info2",
    alias: "${controller}/info2",
  })
  info2(context: Context) {
    context.response.body = "info2";
  }
}
