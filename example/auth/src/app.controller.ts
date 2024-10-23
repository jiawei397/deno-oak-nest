import { Controller, Get } from "@nest/core";

@Controller("")
export class AppController {
  @Get("/")
  hello() {
    return "hello world";
  }
}
