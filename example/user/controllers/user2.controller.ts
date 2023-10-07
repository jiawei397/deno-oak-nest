import { type Context, Controller, Get } from "../../../mod.ts";
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
    return context.json(this.userService.info());
  }

  @Get("/info2", {
    // alias: "/v1/info2",
    alias: "${controller}/info2",
  })
  info2(context: Context) {
    return context.text("info2");
  }
}
