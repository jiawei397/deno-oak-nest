import { Controller, Get } from "@nest";

@Controller("/v2/user", {
  isAliasOnly: true,
})
export class UserControllerV2 {
  @Get("/")
  hello() {
    return "Hello user2!";
  }
}
