import { Controller, Get } from "../mod.ts";

@Controller("")
export class AppController {
  @Get("/")
  version() {
    return "0.0.1";
  }
}
