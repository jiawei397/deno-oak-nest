import { Controller, Get } from "@nest";
import { ConfigService } from "../config/config.service.ts";

@Controller("/cats")
export class CatsController {
  constructor(private readonly configService: ConfigService) {}

  @Get("/")
  hello() {
    return "cats: " + this.configService.get("hostname");
  }
}
