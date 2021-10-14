import { Application, isHttpError, Status } from "../mod.ts";
import router from "./router/index.ts";

const app = new Application();

// Logger
app.use(async (ctx, next) => {
  await next();
  const rt = ctx.response.headers.get("X-Response-Time");
  console.log(`${ctx.request.method} ${ctx.request.url} - ${rt}`);
});

// Timing
app.use(async (ctx, next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  ctx.response.headers.set("X-Response-Time", `${ms}ms`);
});

// if you want to catch the error, you must set it before the routers.
app.use(async (ctx, next) => {
  try {
    await next();
    if (ctx.response.body === undefined && ctx.response.status === 404) {
      ctx.response.body = "not found";
    }
    // ctx.response.body = {
    //   success: true,
    //   data: ctx.response.body
    // }
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
      // rethrow if you can't handle the error
      // throw err;
      ctx.response.status = err.status || 500;
      ctx.response.body = err.message || err;
    }
  }
});

app.use(router.routes());

const port = Number(Deno.env.get("PORT") || 1000);
console.log(`app will start with: http://localhost:${port}`);
await app.listen({ port });
