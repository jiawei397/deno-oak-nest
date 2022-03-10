# oak_nest_redis_module

This is a redis module for [`oak_nest`](https://deno.land/x/oak_nest).

## example

```typescript
import { Module } from "https://deno.land/x/oak_nest@v1.8.2/mod.ts";
import { AppController } from "./app.controller.ts";
import { RedisModule } from "https://deno.land/x/oak_nest@v1.8.2/modules/redis/mod.ts";

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
import { RedisService } from "https://deno.land/x/oak_nest@v1.8.2/modules/redis/mod.ts";
import { Controller, Get } from "https://deno.land/x/oak_nest@v1.8.2/mod.ts";

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
