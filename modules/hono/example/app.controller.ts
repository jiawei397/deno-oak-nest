import {
  BadGatewayException,
  Body,
  Controller,
  Get,
  OnModuleInit,
  Params,
  Post,
  Query,
} from "@nest";
import { AppService } from "./app.service.ts";
import { QueryDto, QueryWithoutPropDto, SaveDto } from "./app.dto.ts";

@Controller("")
export class AppController implements OnModuleInit {
  constructor(private readonly appService: AppService) {
  }

  onModuleInit(): void | Promise<void> {
    console.log("onModuleInit AppController");
  }

  onApplicationBootstrap() {
    console.log("onApplicationBootstrap AppController");
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
}
