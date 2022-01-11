import { RedisService } from "../mod.ts";
import { Controller, Get } from "./deps.ts";

@Controller("")
export class AppController {
  constructor(private readonly redisService: RedisService) {}
  @Get("/")
  async version() {
    await this.redisService.set("version", "1.0.0");
    return this.redisService.get("version");
  }
}
