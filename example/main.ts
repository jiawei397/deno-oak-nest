// deno-lint-ignore-file no-unused-vars no-explicit-any
import { Context, isHttpError, NestFactory, Status } from "../mod.ts";
import { AppModule } from "./app.module.ts";
import { LoggingInterceptor } from "./interceptor/log.interceptor.ts";

const app = await NestFactory.create(AppModule);
app.setGlobalPrefix("/api", {
  exclude: ["^/?v\\d{1,3}/"],
});

app.use((context, next) => {
  (context.request as any).locals = {
    metadata: {
      title: "admin",
    },
    data: {
      content: "hello zhangsan",
    },
  };
  return next();
});

app.useGlobalInterceptors(new LoggingInterceptor());
// app.disableGetComputeEtag();

// must before routes
app.useStaticAssets("example/static", {
  prefix: "static",
  // gzip: true,
});

// Logger
app.use(async (ctx: Context, next) => {
  const start = Date.now();
  await next();
  const rt = `${Date.now() - start}ms`;
  console.log(
    `${ctx.request.method} ${ctx.request.url} - ${ctx.response.status} - ${rt}`,
  );
});

// app.use(proxy("https://www.google.com.hk/"));

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

const port = Number(Deno.env.get("PORT") || 2000);

// app.addEventListener("error", (evt) => {
//   // Will log the thrown error to the console.
//   console.log("------error---", evt.error);
// });

app.addEventListener("listen", ({ hostname, port, secure }) => {
  console.log(
    `Listening on: ${secure ? "https://" : "http://"}${"localhost"}:${port}`,
  );
  // console.log(Deno.memoryUsage());
});

await app.listen({ port });
