import { Controller, Get } from "@nest/core";
import { Render } from "@nest/ejs";

@Controller("")
export class AppController {
  @Get("/")
  @Render("index")
  hello() {
    return {
      message: "Hello ejs",
      user: {
        name: "Tom",
        age: 18,
      },
    };
  }
}
