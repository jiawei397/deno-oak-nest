import { Context, isHttpError, NestFactory, Status } from "../mod.ts";
import { AppModule } from "./app.module.ts";
import { LoggingInterceptor } from "./interceptor/log.interceptor.ts";

const app = await NestFactory.create(AppModule);
app.setGlobalPrefix("/api");
app.useGlobalInterceptors(new LoggingInterceptor());
app.useStaticAssets("example/static", {
  prefix: "static",
  gzip: true,
});

// Logger
app.use(async (ctx: Context, next) => {
  await next();
  const rt = ctx.response.headers.get("X-Response-Time");
  console.log(`${ctx.request.method} ${ctx.request.url} - ${rt}`);
});

// app.use(proxy("https://www.google.com.hk/"));

// // Timing moved to LoggingInterceptor
// app.use(async (ctx: Context, next) => {
//   const start = Date.now();
//   await next();
//   const ms = Date.now() - start;
//   ctx.response.headers.set("X-Response-Time", `${ms}ms`);
// });

// if you want to catch the error, you must set it before the routers.
app.use(async (ctx: Context, next) => {
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

app.get("/hello", (ctx: Context) => {
  ctx.response.body = "hello";
});

app.use(app.routes());

// app.useStaticAssets("example/static");

const port = Number(Deno.env.get("PORT") || 1000);

app.addEventListener("listen", ({ hostname, port, secure }) => {
  console.log(
    `Listening on: ${secure ? "https://" : "http://"}${
      hostname ??
        "localhost"
    }:${port}`,
  );
  // console.log(Deno.memoryUsage());
});

await app.listen({ port });
