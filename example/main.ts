// deno-lint-ignore-file no-unused-vars no-explicit-any
import {
  Context,
  HTTPException,
  NestFactory,
  NestRequest,
  NestResponse,
  NextFunction,
  Status,
} from "../mod.ts";
import { AppModule } from "./app.module.ts";
import { LoggingInterceptor } from "./interceptor/log.interceptor.ts";

const app = await NestFactory.create(AppModule);

app.get("/", (req: NestRequest, res: NestResponse) => {
  res.body = "hello world";
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
app.use(async (req: NestRequest, res: NestResponse, next: NextFunction) => {
  console.log("logger----", req.url);
  const start = Date.now();
  await next();
  const rt = `${Date.now() - start}ms`;
  console.log(
    `${req.method} ${req.url} - ${res.status} - ${rt}`,
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

const port = Number(Deno.env.get("PORT") || 2000);

app.notFound((req, res) => {
  res.body = "not found";
  res.status = 404;
});

app.onError((err, req, res) => {
  // console.error("error", err);
  res.body = err.message;
  res.status = 500;
});

app.listen({
  port,
  onListen({ port, hostname }) {
    console.log(`Server started at http://${hostname}:${port}`);
  },
});
