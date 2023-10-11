import { NestFactory } from "@nest";
import { HonoRouter } from "@nest/hono";
import { CORS } from "@nest/cors";

import { AppModule } from "./app.module.ts";

const app = await NestFactory.create(AppModule, HonoRouter);
app.use(CORS());

const port = Number(Deno.env.get("PORT") || 2000);
app.listen({
  port,
  //   onListen({ port, hostname }) {
  //     console.log(`Server started at http://${hostname}:${port}`);
  //   },
});
