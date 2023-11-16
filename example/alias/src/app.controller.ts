import { Controller, Get } from "@nest";

@Controller("", {
  alias: "v1/app",
})
export class AppController {
  @Get("/")
  hello() {
    return "Hello World!";
  }

  @Get("/alias", {
    alias: "/v2/alias",
  })
  v2() {
    return "Hello World!";
  }

  @Get("/v3/alias", {
    isAliasOnly: true,
  })
  v3() {
    return "Hello World!";
  }
}
