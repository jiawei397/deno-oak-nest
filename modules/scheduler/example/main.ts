import { Context, NestFactory } from "../../../mod.ts";
import { AppModule } from "./app.module.ts";

const app = await NestFactory.create(AppModule);
app.setGlobalPrefix("/api");

app.get("/hello", (ctx: Context) => {
  ctx.response.body = "hello";
});

app.use(app.routes());

const port = Number(Deno.env.get("PORT") || 1000);
console.log(`app will start with: http://localhost:${port}`);
await app.listen({ port });
