# hbs

This is a `hbs`(`Handlebars`) module for
[`deno_nest`](https://deno.land/x/deno_nest).

You can see the `Handlebars` [document](https://handlebarsjs.com/).

## example

Add import map in `deno.json`:

```json
{
  "imports": {
    "@nest": "https://deno.land/x/deno_nest@v3.11.0/mod.ts",
    "@nest/hono": "https://deno.land/x/deno_nest@v3.11.0/modules/hono/mod.ts",
    "hono/": "https://deno.land/x/hono@v3.9.1/",
    "@nest/hbs": "https://deno.land/x/deno_nest@v3.11.0/modules/hbs/mod.ts"
  }
}
```

Then set `base view dir` in `main.ts`:

```typescript
import { setBaseViewsDir } from "@nest/hbs";

const app = await NestFactory.create(AppModule, Router);
setBaseViewsDir("views/");
```

Then can use `Render` decorator in `controller`:

```ts
import { Controller, Get } from "@nest";
import { Render } from "@nest/hbs";

@Controller("")
export class AppController {
  @Get("/")
  @Render("index")
  hello() {
    return {
      message: "Hello hbs",
    };
  }
}
```

> It should be noted that you must directly return the parameters required for
> the ejs file in the method.

This method will find `views/index.hbs` and render it. Here is a hbs example:

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Nest</title>
  </head>
  <body>
    <h1>Nest</h1>
    <p> {{ message }}</p>
  </body>
</html>
```

More can see the example dir.
