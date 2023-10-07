import { Context, isHttpError, NestFactory, Status } from "../../../mod.ts";
import { AppModule } from "./app.module.ts";

const app = await NestFactory.create(AppModule);
app.setGlobalPrefix("/api");

app.get("/hello", (ctx: Context) => {
  ctx.response.body = "hello";
});

app.use(async (ctx: Context, next) => {
  try {
    await next();
    if (ctx.response.body === undefined && ctx.response.status === 404) {
      ctx.response.body = "not found";
    }
  } catch (err) {
    console.error("middleware", err);
    if (isHttpError(err)) {
      switch (err.status) {
        case Status.NotFound:
          // handle NotFound
          ctx.response.body = "404";
          break;
        default:
          // handle other statuses
      }
    } else {
      ctx.response.status = err.status || 500;
      ctx.response.body = err.message || err;
    }
  }
});

app.use(app.routes());

const port = Number(Deno.env.get("PORT") || 1000);
console.log(`app will start with: http://localhost:${port}`);
await app.listen({ port });
