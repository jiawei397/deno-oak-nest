import { Controller, Get } from "./deps.ts";

@Controller("")
export class AppController {
  @Get("/")
  hello() {
    return "Hello World!";
  }
}
