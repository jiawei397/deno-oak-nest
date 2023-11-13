import {
  Controller,
  Get,
  getReadableStream,
  Header,
  Res,
  type Response,
} from "@nest";

@Controller("")
export class AppController {
  /**
   * response an stream, can test by `curl http://localhost:2000/stream`
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

  @Get("/file")
  @Header("Content-Type", "application/octet-stream")
  @Header("Content-Disposition", 'attachment; filename="README.md"')
  async file() {
    const input = await Deno.open("README.md", { read: true });
    return input.readable;
  }

  @Get("/file2")
  async file2(@Res() res: Response) {
    const input = await Deno.open("README.md", { read: true });
    res.headers.set("Content-Type", "application/octet-stream");
    res.headers.set("Content-Disposition", 'attachment; filename="README.md"');
    return input.readable;
  }
}
