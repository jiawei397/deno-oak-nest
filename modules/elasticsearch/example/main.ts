import { Context, NestFactory } from "./deps.ts";
import { AppModule } from "./app.module.ts";

const app = await NestFactory.create(AppModule);
app.setGlobalPrefix("/api");

app.get("/hello", (ctx: Context) => {
  ctx.response.body = "hello";
});

app.use(async (ctx, next) => {
  try {
    await next();
  } catch (e) {
    console.error(e);
    ctx.response.body = e.stack;
    ctx.response.status = e.status || 500;
  }
});

app.use(app.routes());

const port = Number(Deno.env.get("PORT") || 1000);
console.log(`app will start with: http://localhost:${port}/api`);
await app.listen({ port });
