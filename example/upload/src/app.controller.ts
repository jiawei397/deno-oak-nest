import { Controller, Form, Get, Post } from "@nest/core";
import { UploadDto } from "../src/app.dto.ts";

@Controller("")
export class AppController {
  @Get("/")
  hello() {
    return "Hello World!";
  }

  @Post("/upload")
  upload(
    @Form({
      maxFileSize: 10,
    }) result: UploadDto,
  ) {
    console.log(result);
    return "upload ok";
  }
}
