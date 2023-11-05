# nest_oak

This is a `oak` module for [`deno_nest`](https://deno.land/x/deno_nest).

## example

Add import map in `deno.json`:

```json
{
  "imports": {
    "@nest": "https://deno.land/x/deno_nest@v3.6.2/mod.ts",
    "@nest/hono": "https://deno.land/x/deno_nest@v3.6.2/modules/hono/mod.ts",
    "oak": "https://deno.land/x/oak@v12.6.1/mod.ts",
    "class_validator": "https://deno.land/x/deno_class_validator@v1.0.0/mod.ts"
  }
}
```

You can change the `oak` version for yourself, but the safest use is to use the
version recommended by Nest, as it has undergone thorough unit testing.

app.module.ts:

```typescript
import { NestFactory } from "@nest";
import { Router } from "@nest/oak";
import { AppModule } from "./app.module.ts";

const app = await NestFactory.create(AppModule, Router);
app.setGlobalPrefix("/api");
app.useStaticAssets("example/static", {
  prefix: "static",
});

const port = Number(Deno.env.get("PORT") || 2000);
await app.listen({
  port,
});
```

More can see the example dir.
