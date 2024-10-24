import {
  BadGatewayException,
  Body,
  Controller,
  Get,
  Params,
  Post,
  Query,
  REDIRECT_BACK,
  Res,
  type Response,
} from "@nest/core";
import type { AppService } from "./app.service.ts";
import type { QueryDto, QueryWithoutPropDto, SaveDto } from "./app.dto.ts";
import type { HonoContext } from "@nest/hono";

@Controller("")
export class AppController {
  constructor(private readonly appService: AppService) {
  }

  @Get("/")
  hello() {
    return this.appService.hello();
  }

  @Get("/bool")
  bool() {
    return true;
  }

  @Get("/hello/:name")
  helloName(@Params("name") name: string) {
    return `Hello ${name}!`;
  }

  @Get("/query")
  query(@Query("name") name: string) {
    return `Hello ${name}!`;
  }

  @Get("/error")
  error() {
    throw new Error("this is my error");
  }

  @Get("/exception")
  exception() {
    // {
    //   "statusCode": 502,
    //   "message": "this is my bad exception",
    //   "error": "Bad Gateway"
    //   }
    throw new BadGatewayException("this is my bad exception");
  }

  @Get("/exceptionWithSelfDefine")
  exceptionWithSelfDefine() {
    // {
    //   "code": 1001,
    //   "message": "this is my bad exception"
    // }
    throw new BadGatewayException(
      // {
      //   code: 1001,
      //   message: "this is my bad exception",
      // },
      "this is my bad exception",
      "this is my bad exception description",
      // "this is my error",
    );
  }

  /**
   * This example will auto validate the body, because the SaveDto used the `class_validator` decorators.
   *
   * If you set  `SaveDto` to `any` or a interface, it will not work.
   */
  @Post("/save")
  save(@Body() body: SaveDto) {
    console.log(body);
    return {
      success: true,
      data: body,
    };
  }

  /**
   * This example will work, because the QueryDto has the`@Property()` decorator.
   * @example `curl http://localhost:2000/api/validQueryWithoutProp?sex=true&keys=a,b&age=13`
   */
  @Get("/validQuery")
  validQuery(@Query() query: QueryDto) {
    console.log("query", query);
    //   {
    //     "sex": true,
    //     "keys": [
    //         "a",
    //         "b"
    //     ],
    //     "age": 13
    // }
    return query;
  }

  /**
   * This example will not work, because the QueryWithoutPropDto does not have the`@Property()` decorator.
   * @example `curl http://localhost:2000/api/validQueryWithoutProp?sex=true&keys=a,b&age=13`
   */
  @Get("/validQueryWithoutProp")
  validQueryWithoutProp(@Query() query: QueryWithoutPropDto) {
    console.log("query", query);
    return query;
  }

  @Get("/redirect")
  redirect(@Res() res: Response) {
    res.headers.set("Location", "https://www.baidu.com");
    res.status = 302;
  }

  @Get("/redirect2")
  redirect2(@Res() res: Response) {
    res.redirect(REDIRECT_BACK);
  }

  @Get("/originContext")
  originContext(@Res() res: Response) {
    const context = res.getOriginalContext<HonoContext>();
    return context.json({
      data: "from origin context",
    });
  }
}
