import { ElasticsearchService } from "../mod.ts";
import { Controller, Get } from "./deps.ts";

@Controller("")
export class AppController {
  constructor(private readonly elasticSearchService: ElasticsearchService) {}
  @Get("/")
  getById() {
    return this.elasticSearchService.get({
      index: "blog",
      id: "60f69db67cd836379015f256",
    });
  }
}
