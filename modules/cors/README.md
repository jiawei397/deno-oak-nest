# CORS

Forked from the Node.js package `expressjs cors`. Now it is just a simple and opinionated cors middleware.

Example

```ts
import { NestFactory } from "https://deno.land/x/deno_nest@v3.1.4/mod.ts";
import { HonoRouter } from "https://deno.land/x/deno_nest@v3.1.4/modules/hono/mod.ts";
import { CORS } from "https://deno.land/x/deno_nest@v3.1.4/modules/cors/mod.ts";
import { AppModule } from "./app.module.ts";

const app = await NestFactory.create(AppModule, HonoRouter);
app.use(CORS());

const port = Number(Deno.env.get("PORT") || 2000);
console.log(`app will start with: http://localhost:${port}/api`);

app.listen({ port });
```

If you use the default options, it will work as both `origin: true` and `credentials: true`.

Test in browser:

```js
fetch('http://localhost:2000', {
  method: 'GET',
  mode: 'cors',
})
.then(response => response.text())
.then(data => {
  console.log(data);
});
```
