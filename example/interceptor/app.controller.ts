// deno-lint-ignore-file no-unused-vars
import { Controller, Get, UseInterceptors } from "@nest";
import {
  CacheInterceptor,
  ErrorsInterceptor,
  LoggingInterceptor,
} from "./interceptor.ts";

@Controller("")
// @UseInterceptors(LoggingInterceptor)
export class AppController {
  @Get("/")
  // @UseInterceptors(LoggingInterceptor)
  hello() {
    return "Hello World!";
  }

  @Get("/err")
  @UseInterceptors(ErrorsInterceptor)
  err() {
    throw new Error("error");
  }

  @Get("/delay")
  @UseInterceptors(CacheInterceptor)
  delay() {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve("delay");
      }, 1000);
    });
  }
}
