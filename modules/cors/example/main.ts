import { HonoRouter, NestFactory } from "./deps.ts";
import { AppModule } from "./app.module.ts";
import { CORS } from "../mod.ts";

const app = await NestFactory.create(AppModule, HonoRouter);
app.use(CORS());

const port = Number(Deno.env.get("PORT") || 2000);
console.log(`app will start with: http://localhost:${port}/api`);

app.listen({ port });
