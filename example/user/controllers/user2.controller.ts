import { Context, Controller, Get } from "../../../mod.ts";
import { UserService } from "../services/user.service.ts";

@Controller("/v1/user", {
  isAbsolute: true,
})
export class User2Controller {
  constructor(
    private readonly userService: UserService,
  ) {
  }
  @Get("/user2")
  info(context: Context) {
    context.response.body = this.userService.info();
  }
}
