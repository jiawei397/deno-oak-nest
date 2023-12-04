import { Controller, Get } from "@nest";
import { Render } from "@nest/hbs";

@Controller("")
export class AppController {
  @Get("/")
  @Render("index")
  hello() {
    return {
      message: "Hello handlebars",
    };
  }
}
