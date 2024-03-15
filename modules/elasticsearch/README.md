# nest_elasticsearch_module

This is a redis module for [`deno_nest`](https://deno.land/x/deno_nest).

## example

Add import map in `deno.json`:

```json
{
  "imports": {
    "@nest": "https://deno.land/x/deno_nest@v3.14.1/mod.ts",
    "@nest/hono": "https://deno.land/x/deno_nest@v3.14.1/modules/hono/mod.ts",
    "@nest/elasticsearch": "https://deno.land/x/deno_nest@v3.14.1/modules/elasticsearch/mod.ts",
    "hono/": "https://deno.land/x/hono@v4.1.0/"
  }
}
```

Then use in `AppModule`:

```typescript
import { Module } from "@nest";
import { ElasticsearchModule } from "@nest/elasticsearch";
import { AppController } from "./app.controller.ts";

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
import { assert, Controller, Get } from "@nest";
import { ElasticsearchService } from "@nest/elasticsearch";

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
