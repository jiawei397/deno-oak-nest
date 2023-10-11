# oak_nest_redis_module

This is a redis module for [`oak_nest`](https://deno.land/x/oak_nest).

## example

Add import map in `deno.json`:

```json
{
  "imports": {
    "@nest": "https://deno.land/x/oak_nest@v2.0.1/mod.ts",
    "@nest/hono": "https://deno.land/x/oak_nest@v2.0.1/modules/hono/mod.ts",
    "@nest/redis": "https://deno.land/x/oak_nest@v2.0.1/modules/redis/mod.ts"
  }
}
```

app.module.ts:

```typescript
import { Module } from "@nest";
import { createStore, RedisModule } from "@nest/redis";
import { CacheModule } from "@nest/cache";
import { AppController } from "./app.controller.ts";

@Module({
  imports: [
    RedisModule.forRoot({
      port: 6379,
      hostname: "192.168.21.176",
      password: "123456",
    }),
  ],
  controllers: [AppController],
})
export class AppModule {}
```

Then can be used in AppController:

```ts
import { Controller, Get, Inject, UseInterceptors } from "@nest";
import { CacheInterceptor, SetCacheStore } from "@nest/cache";
import { type Redis, REDIS_KEY, RedisService } from "@nest/redis";

@Controller("")
export class AppController {
  constructor(private readonly redisService: RedisService) {}
  @Get("/")
  version() {
    this.redisService.set("version", "1.0.0");
    return this.redisService.get("version");
  }
}
```

More can see the example dir.
