import { Controller, Get, getReadableStream, Header } from "../mod.ts";
import { UserService } from "./user/services/user.service.ts";

@Controller("")
export class AppController {
  constructor(private readonly userService: UserService) {}
  @Get("/", {
    alias: "/v1/version", // this will make an extra route
  })
  version() {
    console.log(this.userService.info());
    return "0.0.1";
  }

  /**
   * response an stream, can test by `curl http://localhost:2000/stream`
   */
  @Get("/stream")
  stream() {
    let timer: number | undefined = undefined;
    const { body, write, end } = getReadableStream();
    let num = 0;
    timer = setInterval(() => {
      if (num === 5) {
        clearInterval(timer);
        console.info("end");
        return end();
      }
      num++;
      const message = `It is ${new Date().toISOString()}\n`;
      console.log(message);
      write(message);
    }, 1000);
    return body;
  }

  @Get("/v2/test", {
    isAbsolute: true,
  })
  @Header("a", "b")
  @Header("c", "d")
  test() {
    return "test";
  }
}
