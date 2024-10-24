import { NestFactory } from "@nest/core";
import { Router } from "@nest/hono";
import { AppModule } from "./app.module.ts";
// deno-lint-ignore no-unused-vars
import { LoggingInterceptor } from "./interceptor.ts";

const app = await NestFactory.create(AppModule, Router);
// app.useGlobalInterceptors(LoggingInterceptor);
// app.useGlobalInterceptors(new LoggingInterceptor());

const port = Number(Deno.env.get("PORT") || 2000);
app.listen({ port });
