import { ES_KEY } from "./es.constant.ts";
import { ElasticsearchService } from "./es.service.ts";
import type { ElasticSearchOptions } from "./types.ts";
import { DynamicModule, Module } from "../../../mod.ts";

@Module({})
export class ElasticsearchModule {
  static forRoot(options: ElasticSearchOptions): DynamicModule {
    return {
      module: ElasticsearchModule,
      providers: [{
        provide: ES_KEY,
        useValue: options,
      }, ElasticsearchService],
    };
  }
}
