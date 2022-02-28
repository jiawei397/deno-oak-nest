// deno-lint-ignore-file no-unused-vars no-explicit-any
import { Context, isHttpError, NestFactory, resolve, Status } from "../mod.ts";
import { AppModule } from "./app.module.ts";
import { dirname, fromFileUrl, renderFile } from "./deps.ts";
import { LoggingInterceptor } from "./interceptor/log.interceptor.ts";
const __dirname = dirname(fromFileUrl(import.meta.url));

const app = await NestFactory.create(AppModule);
app.setGlobalPrefix("/api");

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
app.useStaticAssets("example/static", {
  prefix: "static",
  // gzip: true,
});

// Without trailing slash
app.setView({
  // prefix: "example",
  baseDir: "example/views",
  // baseDir: resolve(__dirname, "./views"),
  extension: "ejs",
  renderFile: (path: string, context: Context) => {
    const request = context.request as any;
    const response = context.response as any;
    return renderFile(path, {
      metadata: {
        title: "test",
      },
      data: {
        content: "hello data",
      },
      ...request.locals,
      ...response.locals,
    });
  },
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
