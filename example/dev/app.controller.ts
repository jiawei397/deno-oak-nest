// deno-lint-ignore-file no-unused-vars
import {
  BadRequestException,
  Controller,
  Get,
  getReadableStream,
  Header,
  UseFilters,
  UseInterceptors,
} from "@nest";
import { AllExceptionsFilter, HttpExceptionFilter } from "./exception.ts";
import { ErrorsInterceptor } from "./interceptor/errors.interceptor.ts";
import { UserService } from "./user/services/user.service.ts";

@Controller("")
// @UseFilters(HttpExceptionFilter)
// @UseFilters(new HttpExceptionFilter())
export class AppController {
  constructor(private readonly userService: UserService) {}

  @Get("/", {
    alias: "/v1/version", // this will make an extra route
  })
  async version() {
    console.log(await this.userService.info());
    return "0.0.1";
  }

  // @UseFilters(HttpExceptionFilter)
  // @UseFilters(AllExceptionsFilter)
  @UseInterceptors(ErrorsInterceptor)
  @Get("/error")
  error() {
    throw new BadRequestException("bad request");
    // throw new Error("error");
  }

  /**
   * response an stream, can test by `curl http://localhost:2000/api/stream`
   */
  @Get("/stream")
  stream() {
    const { body, write, end } = getReadableStream();
    let num = 0;
    const timer = setInterval(() => {
      if (num === 10) {
        clearInterval(timer);
        console.info("end");
        try {
          end("Task successfully end");
        } catch (error) {
          console.error("end", error); // TypeError: The stream controller cannot close or enqueue
        }
        return;
      }
      num++;
      const message = `It is ${new Date().toISOString()}\n`;
      console.log(message);
      try {
        write(message);
      } catch (error) {
        console.error("write", error); // TypeError: The stream controller cannot close or enqueue
        clearInterval(timer);
      }
    }, 1000);
    return body;
  }

  @Get("/v2/test", {
    isAbsolute: true,
  })
  @Header("a", "b")
  @Header("c", "d")
  test() {
    return true;
  }
}
