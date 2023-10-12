import { NestFactory } from "@nest";
import { OakRouter } from "@nest/oak";
import { AppModule } from "./app.module.ts";

const app = await NestFactory.create(AppModule, OakRouter);
app.setGlobalPrefix("/api");
app.useStaticAssets("example/static", {
  prefix: "static",
});

const port = Number(Deno.env.get("PORT") || 2000);
app.listen({ port });
