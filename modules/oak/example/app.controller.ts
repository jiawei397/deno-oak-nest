import { Controller, Get, Params, Query, Res, type Response } from "@nest";
import { AppService } from "./app.service.ts";
import { OakContext } from "@nest/oak";

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
    return `param ${name}!`;
  }

  @Get("/query")
  query(@Query("name") name: string) {
    return `query ${name}!`;
  }

  @Get("/originContext")
  originContext(@Res() res: Response) {
    const context = res.getOriginalContext<OakContext>();
    context.response.body = {
      data: "from origin context",
    };
  }
}
