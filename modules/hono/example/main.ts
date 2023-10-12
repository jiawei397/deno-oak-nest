import { NestFactory } from "@nest";
import { HonoRouter } from "@nest/hono";
import { AppModule } from "./app.module.ts";

const app = await NestFactory.create(AppModule, HonoRouter, { strict: true });
app.setGlobalPrefix("/api");
app.useStaticAssets("example/static", {
  prefix: "static",
});

const port = Number(Deno.env.get("PORT") || 2000);
app.listen({ port });
