import { Controller, Get } from "@nest";

@Controller("")
export class AppController {
  @Get("/")
  hello() {
    return "hello world";
  }
}
