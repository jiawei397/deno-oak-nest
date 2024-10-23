import { NestFactory } from "@nest/core";
import { Router } from "@nest/hono";
import { AppModule } from "./app.module.ts";
import { logger } from "./log.ts";

const app = await NestFactory.create(AppModule, Router);

const port = Number(Deno.env.get("PORT") || 2000);
app.listen({
  port,
  onListen: ({ hostname, port }) =>
    logger.info(`Listening on http://${hostname}:${port}`),
});
