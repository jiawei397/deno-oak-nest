import { Controller, Get, Params, Query } from "@nest";
import { AppService } from "./app.service.ts";

@Controller("")
export class AppController {
  constructor(private readonly appService: AppService) {
  }

  @Get("/")
  hello() {
    return this.appService.hello();
  }

  @Get("/hello/:name")
  helloName(@Params("name") name: string) {
    return `Hello ${name}!`;
  }

  @Get("/query")
  query(@Query("name") name: string) {
    return `Hello ${name}!`;
  }
}
