import { NestFactory } from "@nest";
import { Router } from "@nest/hono";
import { AppModule } from "./app.module.ts";
import { setBaseViewsDir } from "@nest/ejs";

const app = await NestFactory.create(AppModule, Router);
setBaseViewsDir("views");
// setBaseViewsDir("views/");

const port = Number(Deno.env.get("PORT") || 2000);
app.listen({
  port,
});
