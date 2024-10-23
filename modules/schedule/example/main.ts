import { NestFactory } from "@nest/core";
import { HonoRouter } from "@nest/hono";
import { AppModule } from "./app.module.ts";

const app = await NestFactory.create(AppModule, HonoRouter);
app.setGlobalPrefix("/api");

addEventListener("error", (event) => {
  event.preventDefault();
  console.log("Global error:", event.message);
});

addEventListener("unhandledrejection", (event) => {
  event.preventDefault();
  console.log("unhandledrejection:", event.reason);
});

const port = Number(Deno.env.get("PORT") || 2000);
app.listen({ port });
