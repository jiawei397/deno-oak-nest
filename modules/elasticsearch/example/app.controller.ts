import { ElasticsearchService } from "@nest/elasticsearch";
import { Controller, Get } from "@nest";

@Controller("")
export class AppController {
  constructor(private readonly elasticSearchService: ElasticsearchService) {}
  @Get("/")
  getById() {
    return this.elasticSearchService.get({
      index: "document_doc_api2",
      id: "thingjs-api10_62b80206cd02b2892ff4ee8f",
    });
  }
}
