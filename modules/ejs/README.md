# EJS

This is a `ejs` module for [`deno_nest`](https://deno.land/x/deno_nest).

You can see the `ejs` [document](https://github.com/mde/ejs).

## example

Add import map in `deno.json`:

```json
{
  "imports": {
    "@nest": "https://deno.land/x/deno_nest@v3.13.0/mod.ts",
    "@nest/hono": "https://deno.land/x/deno_nest@v3.13.0/modules/hono/mod.ts",
    "hono/": "https://deno.land/x/hono@v4.1.0/",
    "@nest/ejs": "https://deno.land/x/deno_nest@v3.13.0/modules/ejs/mod.ts"
  }
}
```

Then set `base view dir` in `main.ts`:

```typescript
import { setBaseViewsDir } from "@nest/ejs";

const app = await NestFactory.create(AppModule, Router);
setBaseViewsDir("views/");
```

Then can use `Render` decorator in `controller`:

```ts
import { Controller, Get } from "@nest";
import { Render } from "@nest/ejs";

@Controller("")
export class AppController {
  @Get("/")
  @Render("index")
  hello() {
    return {
      message: "Hello ejs",
    };
  }
}
```

> It should be noted that you must directly return the parameters required for
> the ejs file in the method.

This method will find `views/index.ejs` and render it. Here is an ejs example:

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Nest</title>
  </head>
  <body>
    <h1>Nest</h1>
    <p><%= message %></p>
  </body>
</html>
```

More can see the example dir.
