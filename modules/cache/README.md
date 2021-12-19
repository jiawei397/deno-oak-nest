# oak_nest_cache_module

This is a cache module for [`oak_nest`](https://deno.land/x/oak_nest).

## example

```typescript
import { Module } from "https://deno.land/x/oak_nest/mod.ts";
import { CacheModule } from "https://deno.land/x/oak_nest/modules/cache/mod.ts";
import { AppController } from "./app.controller.ts";

@Module({
  imports: [
    CacheModule.register({
      ttl: 60,
    }),
  ],
  controllers: [AppController],
})
export class AppModule {}
```

Then `CacheInterceptor` can be used in any Controllers, or in a specific method.

```ts
import { CacheInterceptor } from "https://deno.land/x/oak_nest/modules/cache/mod.ts";
import { Controller, Get } from "https://deno.land/x/oak_nest/mod.ts";

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

- [ ] store