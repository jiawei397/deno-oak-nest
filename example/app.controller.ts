import { Controller, Get, Header } from "../mod.ts";
import { UserService } from "./user/services/user.service.ts";

@Controller("")
export class AppController {
  constructor(private readonly userService: UserService) {}
  @Get("/", {
    alias: "/v1/version", // this will make an extra route
  })
  version() {
    console.log(this.userService.info());
    return "0.0.1";
  }

  @Get("/v2/test", {
    isAbsolute: true,
  })
  @Header("a", "b")
  @Header("c", "d")
  test() {
    return "test";
  }
}
