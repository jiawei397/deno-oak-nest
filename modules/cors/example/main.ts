import { NestFactory } from "@nest/core";
import { Router } from "@nest/hono";
import { CORS } from "@nest/cors";

import { AppModule } from "./app.module.ts";

const app = await NestFactory.create(AppModule, Router);
app.use(CORS());

await app.listen({
  port: 2000,
});
