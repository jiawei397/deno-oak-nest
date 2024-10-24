import { NestFactory } from "@nest/core";
import { Router } from "@nest/hono";
import { AppModule } from "./app.module.ts";

const app = await NestFactory.create(AppModule, Router);

app.enableShutdownHooks(["SIGINT"]);

const port = Number(Deno.env.get("PORT") || 2000);
await app.listen({
  port,
});

// setTimeout(() => {
//   app.close();
//   console.log("server closed");
// }, 1000);
