import { NestFactory } from "@nest";
import { Router } from "@nest/hono";
import { AppModule } from "./app.module.ts";
import { CORS } from "@nest/cors";

const app = await NestFactory.create(AppModule, Router);
app.use(CORS());

const port = Number(Deno.env.get("PORT") || 2000);
app.listen({ port });
