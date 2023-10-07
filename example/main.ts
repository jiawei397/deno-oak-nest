// deno-lint-ignore-file no-unused-vars no-explicit-any
import { Context, HTTPException, NestFactory, Status } from "../mod.ts";
import { AppModule } from "./app.module.ts";
import { LoggingInterceptor } from "./interceptor/log.interceptor.ts";

const app = await NestFactory.create(AppModule);

app.get("/", (ctx: Context) => {
  return ctx.body("hello world");
});
app.setGlobalPrefix("/api", {
  exclude: ["^/?v\\d{1,3}/"],
});

// app.use((context, next) => {
//   (context.req as any).locals = {
//     metadata: {
//       title: "admin",
//     },
//     data: {
//       content: "hello zhangsan",
//     },
//   };
//   return next();
// });

app.useGlobalInterceptors(new LoggingInterceptor());

// must before routes
app.useStaticAssets("example/static", {
  prefix: "static",
});

// Logger
app.use("*", async (ctx: Context, next) => {
  console.log(ctx.req, ctx.res);
  console.log("logger----", ctx.req.url);
  const start = Date.now();
  await next();
  const rt = `${Date.now() - start}ms`;
  console.log(
    `${ctx.req.method} ${ctx.req.url} - ${ctx.res.status} - ${rt}`,
  );
});

// // app.use(proxy("https://www.google.com.hk/"));

// // if you want to catch the error, you must set it before the routers.
// app.use(async (ctx: Context, next) => {
//   try {
//     await next();
//     if (ctx.res.body === undefined && ctx.res.status === 404) {
//       return ctx.body("not found");
//     }
//     // ctx.response.body = {
//     //   success: true,
//     //   data: ctx.response.body
//     // }
//   } catch (err) {
//     console.error("middleware", err);
//     if (err instanceof HTTPException) {
//       switch (err.status) {
//         case Status.NotFound:
//           // handle NotFound
//           // ctx.response.body = "404";
//           return ctx.body("404");
//           break;
//         default:
//           // handle other statuses
//       }
//     } else {
//       // rethrow if you can't handle the error
//       // throw err;
//       // ctx.response.status = err.status || 500;
//       // ctx.response.body = err.message || err;
//       ctx.status(err.status || 500);
//       return ctx.body(err.message || err);
//     }
//   }
// });

// app.get("/hello", (ctx: Context) => {
//   // ctx.response.body = "hello";
//   return ctx.body("hello");
// });

app.routes2();

const port = 8000; // Number(Deno.env.get("PORT") || 2000);

// // app.addEventListener("error", (evt) => {
// //   // Will log the thrown error to the console.
// //   console.log("------error---", evt.error);
// // });

// addEventListener("unhandledrejection", (evt) => {
//   evt.preventDefault();
//   console.error(`unhandledrejection`, evt.reason);
// });

// addEventListener("error", (evt) => {
//   evt.preventDefault(); // 这句很重要
//   console.error(`global error`, evt.error);
// });

app.onError((err, ctx) => {
  console.error("error", err);
  return ctx.body(err.message, 500);
});

// app.addEventListener("listen", ({ hostname, port, secure }) => {
//   console.log(
//     `Listening on: ${secure ? "https://" : "http://"}${"localhost"}:${port}`,
//   );
//   // console.log(Deno.memoryUsage());
// });

// await app.listen({ port });
Deno.serve({ port }, app.fetch);
