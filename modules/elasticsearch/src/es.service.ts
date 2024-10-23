import { Client } from "../deps.ts";
import { Inject, Injectable } from "@nest/core";
import { ES_KEY } from "./es.constant.ts";
import type { ElasticSearchOptions } from "./types.ts";

@Injectable()
export class ElasticsearchService extends Client {
  constructor(@Inject(ES_KEY) options: ElasticSearchOptions) {
    super(options);
  }
}
