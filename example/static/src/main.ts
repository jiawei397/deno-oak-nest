import { NestFactory } from "@nest";
import { Router } from "@nest/hono";
import { AppModule } from "./app.module.ts";

const app = await NestFactory.create(AppModule, Router);
app.useStaticAssets("public");
// app.useStaticAssets("public", {
//   prefix: "static",
// });
// app.useStaticAssets("public", {
//   prefix: "/static",
// });
app.setGlobalPrefix("/api");

const port = Number(Deno.env.get("PORT") || 2000);
app.listen({ port });
