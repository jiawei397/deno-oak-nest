import { Controller, Get } from "@nest/core";
import { Logger } from "./log.ts";

@Controller("")
export class AppController {
  constructor(private logger: Logger) {}

  @Get("/")
  hello() {
    this.logger.info("hello world");
    return "Hello World!";
  }
}