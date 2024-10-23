import { NestFactory } from "@nest/core";
import { HonoRouter } from "@nest/hono";
import { AppModule } from "./app.module.ts";
import { HttpExceptionsFilter } from "./exception.ts";

const app = await NestFactory.create(AppModule, HonoRouter);
app.setGlobalPrefix("/api");

app.useGlobalFilters(HttpExceptionsFilter);

const port = Number(Deno.env.get("PORT") || 2000);
app.listen({ port });
