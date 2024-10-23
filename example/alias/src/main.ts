import { NestFactory } from "@nest/core";
import { Router } from "@nest/hono";
import { AppModule } from "./app.module.ts";

const app = await NestFactory.create(AppModule, Router);
app.setGlobalPrefix("/api");

const port = Number(Deno.env.get("PORT") || 2000);
app.listen({ port });
