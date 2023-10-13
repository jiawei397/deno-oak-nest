import { NestFactory } from "@nest";
import { HonoRouter } from "@nest/hono";
import { AppModule } from "./app.module.ts";
import { HttpExceptionFilter } from "./exception.ts";

const app = await NestFactory.create(AppModule, HonoRouter, { strict: true });
app.setGlobalPrefix("/api");
app.useStaticAssets("example/static", {
  prefix: "static",
});
app.useGlobalFilters(HttpExceptionFilter);

const port = Number(Deno.env.get("PORT") || 2000);
app.listen({ port });

// setTimeout(() => {
//   app.close();
//   console.log("server closed");
// }, 1000);
