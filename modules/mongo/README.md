# nest_mongo_module

This is a `mongodb` module for [`deno_nest`](https://deno.land/x/deno_nest).

## example

Add import map in `deno.json`:

```json
{
  "imports": {
    "@nest": "https://deno.land/x/deno_nest@v3.10.2/mod.ts",
    "@nest/hono": "https://deno.land/x/deno_nest@v3.10.2/modules/hono/mod.ts",
    "@nest/mongo": "https://deno.land/x/deno_nest@v3.10.2/modules/mongo/mod.ts",
    "hono/": "https://deno.land/x/hono@v3.9.1/",
    "deno_mongo_schema": "https://deno.land/x/deno_mongo_schema@v1.0.3/mod.ts",
    "class_validator": "https://deno.land/x/deno_class_validator@v1.0.0/mod.ts"
  }
}
```

You can change the `deno_mongo_schema` version for yourself.

app.module.ts:

```typescript
import { Module } from "@nest";
import { MongoModule } from "@nest/mongo";
import { UserModule } from "./user/user.module.ts";

@Module({
  imports: [
    MongoModule.forRoot("mongodb://10.100.30.65:27018/test"),
    UserModule,
  ],
  controllers: [],
})
export class AppModule {}
```

More can see the example dir.
