// deno-lint-ignore-file require-await
import { Controller, Get } from "@nest/core";
import { CatsService } from "./cats.service.ts";
import { Cat } from "./cats.interface.ts";
import { LogService } from "./log.service.ts";

@Controller("/cats")
export class CatsController {
  constructor(
    private catsService: CatsService,
    private logService: LogService,
  ) {}

  @Get("/")
  async findAll(): Promise<Cat[]> {
    this.logService.info("findAll");
    return this.catsService.findAll();
  }
}
