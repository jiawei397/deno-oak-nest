import { NestFactory } from "@nest";
import { OakRouter } from "@nest/oak";
import { AppModule } from "./app.module.ts";

const app = await NestFactory.create(AppModule, OakRouter);
app.setGlobalPrefix("/api");
app.useStaticAssets("example/static", {
  prefix: "static",
});

app.use(async (req, res, next) => {
  const start = Date.now();
  console.log(`${req.method} ${req.url}`);
  await next();
  const ms = Date.now() - start;
  res.headers.set("X-Response-Time", `${ms}ms`);
  console.log(`${req.method} ${req.url} - ${ms}ms`);
});

const port = Number(Deno.env.get("PORT") || 2000);
app.listen({ port });
