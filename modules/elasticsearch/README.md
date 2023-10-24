# oak_nest_elasticsearch_module

This is a redis module for [`deno_nest`](https://deno.land/x/deno_nest).

## example

```typescript
import { Module } from "https://deno.land/x/deno_nest@v3.2.0/mod.ts";
import { AppController } from "./app.controller.ts";
import { ElasticsearchModule } from "https://deno.land/x/deno_nest@v3.2.0/modules/elasticsearch/mod.ts";

@Module({
  imports: [
    ElasticsearchModule.forRoot({
      db: "http://elastic:369258@192.168.21.176:9200",
    }),
  ],
  controllers: [AppController],
})
export class AppModule {}
```

Then can be used in AppController:

```ts
import { ElasticsearchService } from "https://deno.land/x/deno_nest@v3.2.0/modules/elasticsearch/mod.ts";
import { Controller, Get } from "https://deno.land/x/deno_nest@v3.2.0/mod.ts";

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
```

More can see the example dir.
