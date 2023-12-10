import { NestFactory } from "@nest";
import { Router } from "@nest/hono";
import { AppModule } from "./app.module.ts";
import config from "./globals.ts";
import { CORS } from "@nest/cors";

const app = await NestFactory.create(AppModule, Router);
app.setGlobalPrefix("/api");
app.useStaticAssets("public");
app.use(CORS());

const port = config.port;
app.listen({ port });
