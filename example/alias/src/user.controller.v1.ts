import { Controller, Get } from "@nest/core";

@Controller("user", {
  alias: "${prefix}/v1/user",
})
export class UserController {
  @Get("/")
  hello() {
    return "Hello user!";
  }
}
