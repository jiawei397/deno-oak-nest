// deno-lint-ignore-file require-await
import { Controller, Get } from "@nest";
import { CatsService } from "./cats.service.ts";
import { Cat } from "./cats.interface.ts";

@Controller("/cats")
export class CatsController {
  constructor(private catsService: CatsService) {}

  @Get("/")
  async findAll(): Promise<Cat[]> {
    return this.catsService.findAll();
  }
}
