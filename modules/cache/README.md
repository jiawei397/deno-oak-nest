# nest_cache_module

This is a cache module for [`deno_nest`](https://deno.land/x/deno_nest).

## example

Add import map in `deno.json`:

```json
{
  "imports": {
    "@nest": "https://deno.land/x/deno_nest@v3.15.0/mod.ts",
    "@nest/hono": "https://deno.land/x/deno_nest@v3.15.0/modules/hono/mod.ts",
    "@nest/cache": "https://deno.land/x/deno_nest@v3.15.0/modules/cache/mod.ts",
    "hono/": "https://deno.land/x/hono@v4.1.0/"
  }
}
```

Then use in `AppModule`:

```typescript
import { Module } from "@nest";
import { CacheModule } from "@nest/cache";
import { AppController } from "./app.controller.ts";

@Module({
  imports: [
    CacheModule.register({
      ttl: 60,
      max: 2,
      isDebug: true,
      // policy: "public",
      // store: "localStorage",
    }),
  ],
  controllers: [AppController],
})
export class AppModule {}
```

Then `CacheInterceptor` can be used in any Controllers, or in a specific method.

```ts
import { Controller, Get, Params, Query, UseInterceptors } from "@nest";
import { CacheInterceptor, CacheTTL, SetCachePolicy } from "@nest/cache";

@Controller("")
@UseInterceptors(CacheInterceptor)
export class AppController {
  @Get("/delay")
  // @UseInterceptors(CacheInterceptor)
  delay(@Query("id") id: string) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve("delay " + id);
      }, 1000);
    });
  }
}
```

More can see the example dir.

## TODO

- [x] store
- [x] Deno.kv
