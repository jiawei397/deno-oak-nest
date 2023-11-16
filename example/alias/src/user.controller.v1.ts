import { Controller, Get } from "@nest";

@Controller("user", {
  alias: "${prefix}/v1/user",
})
export class UserController {
  @Get("/")
  hello() {
    return "Hello user!";
  }
}
