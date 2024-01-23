// deno-lint-ignore-file no-explicit-any no-unused-vars
import {
  APP_FILTER,
  Body,
  CanActivate,
  Catch,
  type Context,
  Controller,
  Delete,
  ExceptionFilter,
  Form,
  Get,
  HttpException,
  Injectable,
  IRouterConstructor,
  Module,
  ModuleType,
  NestFactory,
  NestInterceptor,
  Next,
  Patch,
  Post,
  Put,
  REDIRECT_BACK,
  Res,
  type Response,
} from "@nest";
import { Max, Min } from "class_validator";
import { findUnusedPort } from "./common_helper.ts";
import { assert, assertEquals, assertNotStrictEquals } from "./test_deps.ts";
import { BadRequestException } from "../src/exceptions.ts";
import { APP_GUARD, APP_INTERCEPTOR } from "../src/constants.ts";
import { assertRejects } from "std/assert/assert_rejects.ts";

let firstPort = 8000;

async function getPort() {
  const port = await findUnusedPort(firstPort);
  firstPort++;
  return port;
}

export function createCommonTests(
  Router: IRouterConstructor,
  type: "oak" | "hono",
) {
  let firstPort = 8000;
  async function createApp(module: ModuleType, options?: {
    apiPrefix?: string;
    keys?: string[];
  }) {
    const app = await NestFactory.create(module, Router, options);
    const port = await getPort();
    firstPort++;
    if (options?.apiPrefix) {
      app.setGlobalPrefix(options.apiPrefix);
    }
    await app.listen({ port });
    const baseUrl = `http://localhost:${port}`;
    return { app, port, baseUrl };
  }

  Deno.test(
    `${type} fetch 404`,
    { sanitizeOps: false, sanitizeResources: false },
    async (t) => {
      @Module({})
      class AppModule {}
      const { app, baseUrl } = await createApp(AppModule);

      await t.step("fetch 404", async () => {
        const res = await fetch(baseUrl);
        assertEquals(res.status, 404);
        await res.body?.cancel();
      });
      await app.close();
    },
  );

  Deno.test(
    `${type} fetch success`,
    { sanitizeOps: false, sanitizeResources: false },
    async (t) => {
      await t.step("global prefix not work with app.get", async (it) => {
        const callStack: number[] = [];
        @Module({})
        class AppModule {}

        const { app, baseUrl } = await createApp(AppModule, {
          apiPrefix: "/api",
        });

        app.get("/", (_, res) => {
          callStack.push(1);
          res.body = "hello world";
        });

        await it.step("fetch /", async () => {
          const res = await fetch(`${baseUrl}`);
          assertEquals(res.status, 200);
          assertEquals(await res.text(), "hello world");
          assertEquals(callStack, [1]);
          callStack.length = 0;
        });

        await it.step("fetch /api", async () => {
          const res = await fetch(`${baseUrl}/api`);
          assertEquals(res.status, 404);
          res.body?.cancel();
          assertEquals(callStack, []);
        });

        await app.close();
      });

      await t.step("fetch ok with global prefix, return result", async () => {
        @Controller("/")
        class A {
          @Get("/")
          get() {
            return "hello world";
          }
        }

        @Module({
          controllers: [A],
        })
        class AppModule {}

        const { app, baseUrl } = await createApp(AppModule, {
          apiPrefix: "/api",
        });

        const res = await fetch(`${baseUrl}/api`);
        assertEquals(res.status, 200);
        assertEquals(await res.text(), "hello world");

        await app.close();
      });

      await t.step(
        "fetch ok with global prefix, change with body",
        async () => {
          @Controller("/")
          class A {
            @Get("/")
            b(context: Context) {
              context.response.body = "b";
            }
          }

          @Module({
            controllers: [A],
          })
          class AppModule {}

          const { app, baseUrl } = await createApp(AppModule, {
            apiPrefix: "/api",
          });

          const res = await fetch(`${baseUrl}/api`);
          assertEquals(res.status, 200);
          assertEquals(await res.text(), "b");
          await app.close();
        },
      );

      await t.step("fetch error", async () => {
        @Controller("/")
        class A {
          @Get("/")
          error() {
            throw new Error("error");
          }
        }

        @Module({
          controllers: [A],
        })
        class AppModule {}

        const { app, baseUrl } = await createApp(AppModule, {
          apiPrefix: "/api",
        });

        const res = await fetch(`${baseUrl}/api`);
        assertEquals(res.status, 500);
        assertEquals(await res.json(), {
          "statusCode": 500,
          "message": "error",
          "error": "Internal Server Error",
        });

        await app.close();
      });
    },
  );

  Deno.test(`${type} render null`, {
    sanitizeOps: false,
    sanitizeResources: false,
  }, async (t) => {
    const callStack: number[] = [];
    @Module({})
    class AppModule {}
    const { app, baseUrl } = await createApp(AppModule);
    app.get("/", (req, res) => {
      callStack.push(1);
      res.body = null;
    });
    await t.step("render null", async () => {
      const res = await fetch(`${baseUrl}`);
      assertEquals(res.status, 200);
      assertEquals(await res.text(), "");
      assertEquals(callStack, [1]);
      callStack.length = 0;
    });
  });

  Deno.test(`${type} test strict`, {
    sanitizeOps: false,
    sanitizeResources: false,
  }, async (t) => {
    await t.step("set strict true", async (it) => {
      const callStack: number[] = [];
      @Module({})
      class AppModule {}

      const app = await NestFactory.create(AppModule, Router, { strict: true });

      app.get("/", (_, res) => {
        callStack.push(1);
        res.body = "hello world";
      });

      app.get("/api", (_, res) => {
        callStack.push(2);
        res.body = "api";
      });

      const port = await getPort();
      await app.listen({ port });

      await it.step("fetch /", async () => {
        const res = await fetch(`http://localhost:${port}`);
        assertEquals(res.status, 200);
        assertEquals(await res.text(), "hello world");
        assertEquals(callStack, [1]);
        callStack.length = 0;
      });

      await it.step("fetch /api", async () => {
        const res = await fetch(`http://localhost:${port}/api`);
        assertEquals(res.status, 200);
        assertEquals(await res.text(), "api");
        assertEquals(callStack, [2]);
        callStack.length = 0;
      });

      await it.step("fetch /api/", async () => {
        const res = await fetch(`http://localhost:${port}/api/`);
        assertEquals(res.status, 404);
        await res.body?.cancel();
        assertEquals(callStack, []);
      });

      await app.close();
    });

    await t.step("set strict false", async (it) => {
      const callStack: number[] = [];
      @Module({})
      class AppModule {}

      const app = await NestFactory.create(AppModule, Router, {
        strict: false,
      });

      app.get("/", (_, res) => {
        callStack.push(1);
        res.body = "hello world";
      });

      app.get("/api", (_, res) => {
        callStack.push(2);
        res.body = "api";
      });

      const port = await getPort();
      await app.listen({ port });

      await it.step("fetch /", async () => {
        const res = await fetch(`http://localhost:${port}`);
        assertEquals(res.status, 200);
        assertEquals(await res.text(), "hello world");
        assertEquals(callStack, [1]);
        callStack.length = 0;
      });

      await it.step("fetch /api", async () => {
        const res = await fetch(`http://localhost:${port}/api`);
        assertEquals(res.status, 200);
        assertEquals(await res.text(), "api");
        assertEquals(callStack, [2]);
        callStack.length = 0;
      });

      await it.step("fetch /api/", async () => {
        const res = await fetch(`http://localhost:${port}/api/`);
        assertEquals(res.status, 200);
        assertEquals(await res.text(), "api");
        assertEquals(callStack, [2]);
        callStack.length = 0;
      });

      await app.close();
    });
  });

  Deno.test(
    `${type} method tests`,
    { sanitizeOps: false, sanitizeResources: false },
    async (t) => {
      const callStack: number[] = [];
      const data = { a: 1 };

      @Controller("/")
      class A {
        @Post("/")
        post(@Body() body: any) {
          callStack.push(1);
          assertEquals(body, data);
          return "hello world";
        }

        @Put("/")
        put(@Body() body: any) {
          callStack.push(2);
          assertEquals(body, data);
          return "hello world";
        }

        @Delete("/")
        del() {
          callStack.push(3);
          return "hello world";
        }

        @Patch("/")
        patch() {
          callStack.push(4);
          return "hello world";
        }
      }

      @Module({
        controllers: [A],
      })
      class AppModule {}

      const { app, baseUrl } = await createApp(AppModule);

      await t.step("post", async () => {
        const res = await fetch(`${baseUrl}/`, {
          method: "POST",
          body: JSON.stringify(data),
          headers: {
            "Content-Type": "application/json",
          },
        });
        assertEquals(res.status, 200);
        assertEquals(await res.text(), "hello world");
        assertEquals(callStack, [1]);
        callStack.length = 0;
      });

      await t.step("put", async () => {
        const res = await fetch(`${baseUrl}/`, {
          method: "PUT",
          body: JSON.stringify(data),
          headers: {
            "Content-Type": "application/json",
          },
        });
        assertEquals(res.status, 200);
        assertEquals(await res.text(), "hello world");
        assertEquals(callStack, [2]);
        callStack.length = 0;
      });

      await t.step("delete", async () => {
        const res = await fetch(`${baseUrl}/`, {
          method: "DELETE",
        });
        assertEquals(res.status, 200);
        assertEquals(await res.text(), "hello world");
        assertEquals(callStack, [3]);
        callStack.length = 0;
      });

      await t.step("patch", async () => {
        const res = await fetch(`${baseUrl}/`, {
          method: "PATCH",
        });
        assertEquals(res.status, 200);
        assertEquals(await res.text(), "hello world");
        assertEquals(callStack, [4]);
        callStack.length = 0;
      });

      // last
      await app.close();
    },
  );

  Deno.test(
    `${type} body validate`,
    { sanitizeOps: false, sanitizeResources: false },
    async (t) => {
      const callStack: number[] = [];
      const data = { a: 1 };

      class Dto {
        @Max(5)
        @Min(1)
        a: number;
      }

      @Controller("/")
      class A {
        @Post("/")
        post(@Body() body: Dto) {
          callStack.push(1);
          assertEquals(body, data);
          return "hello world";
        }
      }

      @Module({
        controllers: [A],
      })
      class AppModule {}

      const { app, baseUrl } = await createApp(AppModule);

      await t.step("success", async () => {
        const res = await fetch(`${baseUrl}/`, {
          method: "POST",
          body: JSON.stringify(data),
          headers: {
            "Content-Type": "application/json",
          },
        });
        assertEquals(res.status, 200);
        assertEquals(await res.text(), "hello world");
        assertEquals(callStack, [1]);
        callStack.length = 0;
      });

      await t.step("invalid", async () => {
        const res = await fetch(`${baseUrl}/`, {
          method: "POST",
          body: JSON.stringify({ a: 20 }),
          headers: {
            "Content-Type": "application/json",
          },
        });
        assertEquals(res.status, 400);
        res.body?.cancel();
        assertEquals(callStack, []);
      });

      await t.step("invalid 2", async () => {
        const res = await fetch(`${baseUrl}/`, {
          method: "POST",
          body: JSON.stringify({}),
          headers: {
            "Content-Type": "application/json",
          },
        });
        assertEquals(res.status, 400);
        res.body?.cancel();
        assertEquals(callStack, []);
      });

      // last
      await app.close();
    },
  );

  Deno.test(`${type} use middleware`, {
    sanitizeOps: false,
    sanitizeResources: false,
  }, async (t) => {
    @Module({})
    class AppModule {}

    await t.step("middleware with 404", async () => {
      const app = await NestFactory.create(AppModule, Router);
      const callStack: number[] = [];
      app.use(async (req, res, next) => {
        callStack.push(1);
        await next();
        callStack.push(2);
        assertEquals(res.status, 404);
      });

      const port = await getPort();
      await app.listen({ port });

      const res = await fetch(`http://localhost:${port}`);
      assertEquals(res.status, 404);
      res.body?.cancel();
      assertEquals(callStack, [1, 2]);
      callStack.length = 0;
      await app.close();
    });

    await t.step("middleware with app.get", async (it) => {
      const app = await NestFactory.create(AppModule, Router);
      const callStack: number[] = [];

      app.get("/", (_, res) => {
        callStack.push(3);
        return "hello world";
      });

      app.get("/hello", (_, res) => {
        callStack.push(4);
        res.body = "hello world";
      });

      app.use(async (req, res, next) => {
        callStack.push(1);
        await next();
        callStack.push(2);
      });

      const port = await getPort();
      await app.listen({ port });

      await it.step("fetch /", async () => {
        const res = await fetch(`http://localhost:${port}`);
        assertEquals(res.status, 200);
        assertEquals(await res.text(), "hello world");
        // TODO: this example shows the order of get middleware is not correct in oak, because it used app.use instead of router.use, if use router.use, the order will be correct, but it will not be able to handle 404
        if (type === "hono") {
          assertEquals(callStack, [3]);
        } else if (type === "oak") {
          assertEquals(callStack, [1, 3, 2]);
        }

        callStack.length = 0;
      });

      await it.step("fetch /hello", async () => {
        const res = await fetch(`http://localhost:${port}/hello`);
        assertEquals(res.status, 200);
        assertEquals(await res.text(), "hello world");
        if (type === "hono") {
          assertEquals(callStack, [4]);
        } else if (type === "oak") {
          assertEquals(callStack, [1, 4, 2]);
        }
      });

      // last
      callStack.length = 0;
      await app.close();
    });

    await t.step(
      "middleware with app.get, change middleware order",
      async (it) => {
        const app = await NestFactory.create(AppModule, Router);
        const callStack: number[] = [];

        app.use(async (req, res, next) => {
          callStack.push(1);
          await next();
          callStack.push(2);
        });

        app.get("/", (_, res) => {
          callStack.push(3);
          return "hello world";
        });

        app.get("/hello", (_, res) => {
          callStack.push(4);
          res.body = "hello world";
        });

        const port = await getPort();
        await app.listen({ port });

        await it.step("fetch /", async () => {
          const res = await fetch(`http://localhost:${port}`);
          assertEquals(res.status, 200);
          assertEquals(await res.text(), "hello world");
          assertEquals(callStack, [1, 3, 2]);

          callStack.length = 0;
        });

        await it.step("fetch /hello", async () => {
          const res = await fetch(`http://localhost:${port}/hello`);
          assertEquals(res.status, 200);
          assertEquals(await res.text(), "hello world");
          assertEquals(callStack, [1, 4, 2]);
        });

        // last
        callStack.length = 0;
        await app.close();
      },
    );

    await t.step(
      "middleware change response with res.render()",
      async (it) => {
        const callStack: number[] = [];

        @Controller("/a")
        class A {
          @Get("/")
          get() {
            callStack.push(5);
            return "a";
          }
        }

        @Module({
          controllers: [A],
        })
        class AppModule {}

        const app = await NestFactory.create(AppModule, Router);

        app.use(async (req, res, next) => { // if changed response, must used before router
          callStack.push(1);
          await next();
          callStack.push(2);
          res.headers.set("a", "b");
          return res.render();
        });

        app.get("/", (_, res) => {
          callStack.push(3);
          return "hello world";
        });

        app.get("/hello", (_, res) => {
          callStack.push(4);
          res.body = "hello world";
        });

        const port = await getPort();
        await app.listen({ port });

        await it.step("fetch /", async () => {
          const res = await fetch(`http://localhost:${port}`);
          assertEquals(res.status, 200);
          assertEquals(await res.text(), "hello world");
          assertEquals(res.headers.get("a"), "b");
          assertEquals(callStack, [1, 3, 2]);

          callStack.length = 0;
        });

        await it.step("fetch /hello", async () => {
          const res = await fetch(`http://localhost:${port}/hello`);
          assertEquals(res.status, 200);
          assertEquals(await res.text(), "hello world");
          assertEquals(res.headers.get("a"), "b");
          assertEquals(callStack, [1, 4, 2]);

          callStack.length = 0;
        });

        await it.step("fetch /a", async () => {
          const res = await fetch(`http://localhost:${port}/a`);
          assertEquals(res.status, 200);
          assertEquals(await res.text(), "a");
          assertEquals(res.headers.get("a"), "b");
          assertEquals(callStack, [1, 5, 2]);

          callStack.length = 0;
        });

        // last
        callStack.length = 0;
        await app.close();
      },
    );

    await t.step(
      "middleware change response without res.render()",
      async (it) => {
        const callStack: number[] = [];

        @Controller("/a")
        class A {
          @Get("/")
          get() {
            callStack.push(5);
            return "a";
          }
        }

        @Module({
          controllers: [A],
        })
        class AppModule {}

        const app = await NestFactory.create(AppModule, Router);

        app.use(async (req, res, next) => { // if changed response, must used before router
          callStack.push(1);
          await next();
          callStack.push(2);
          res.headers.set("a", "b");
        });

        app.get("/", (_, res) => {
          callStack.push(3);
          return "hello world";
        });

        app.get("/hello", (_, res) => {
          callStack.push(4);
          res.body = "hello world";
        });

        const port = await getPort();
        await app.listen({ port });

        await it.step("fetch /", async () => {
          const res = await fetch(`http://localhost:${port}`);
          assertEquals(res.status, 200);
          assertEquals(await res.text(), "hello world");
          assertEquals(res.headers.has("a"), false);
          assertEquals(callStack, [1, 3, 2]);

          callStack.length = 0;
        });

        await it.step("fetch /hello", async () => {
          const res = await fetch(`http://localhost:${port}/hello`);
          assertEquals(res.status, 200);
          assertEquals(await res.text(), "hello world");
          assertEquals(res.headers.has("a"), false);
          assertEquals(callStack, [1, 4, 2]);

          callStack.length = 0;
        });

        await it.step("fetch /a", async () => {
          const res = await fetch(`http://localhost:${port}/a`);
          assertEquals(res.status, 200);
          assertEquals(await res.text(), "a");
          assertEquals(res.headers.has("a"), false);
          assertEquals(callStack, [1, 5, 2]);

          callStack.length = 0;
        });

        // last
        callStack.length = 0;
        await app.close();
      },
    );

    await t.step("middleware with controller error", async () => {
      @Controller("/")
      class A {
        @Get("/")
        get() {
          throw new Error("error");
        }
      }

      @Module({
        controllers: [A],
      })
      class AppModule {}

      const app = await NestFactory.create(AppModule, Router);
      const callStack: number[] = [];

      app.use(async (req, res, next) => {
        callStack.push(1);
        await next();
        callStack.push(2);
      });
      const port = await getPort();
      await app.listen({ port });

      // test start
      const errorCallback = (event: Event) => {
        event.preventDefault();
        callStack.push(3);
      };
      addEventListener("error", errorCallback);

      const unhandledrejectionCallback = (event: Event) => {
        event.preventDefault();
        callStack.push(4);
      };
      addEventListener("unhandledrejection", unhandledrejectionCallback);

      const res = await fetch(`http://localhost:${port}`);
      assertEquals(res.status, 500);
      assertEquals(await res.json(), {
        "statusCode": 500,
        "message": "error",
        "error": "Internal Server Error",
      });
      assertEquals(callStack, [1, 2]);

      // last
      callStack.length = 0;
      removeEventListener("error", errorCallback);
      removeEventListener("unhandledrejection", unhandledrejectionCallback);
      await app.close();
    });
  });

  Deno.test(`${type} use middleware and interceptor`, {
    sanitizeOps: false,
    sanitizeResources: false,
  }, async (t) => {
    @Module({})
    class AppModule {}

    await t.step(
      "middleware work, but interceptor not work when 404",
      async () => {
        const callStack: number[] = [];
        const app = await NestFactory.create(AppModule, Router);

        @Injectable()
        class GlobalInterceptor implements NestInterceptor {
          async intercept(_ctx: Context, next: Next) {
            callStack.push(1);
            await next();
            callStack.push(2);
          }
        }

        app.use(async (req, res, next) => {
          callStack.push(3);
          await next();
          callStack.push(4);
          assertEquals(res.status, 404);
        });

        app.useGlobalInterceptors(GlobalInterceptor);

        const port = await getPort();
        await app.listen({ port });

        const res = await fetch(`http://localhost:${port}`);
        assertEquals(res.status, 404);
        res.body?.cancel();
        assertEquals(callStack, [3, 4]);
        callStack.length = 0;
        await app.close();
      },
    );

    await t.step(
      "interceptor not work when use app.get",
      async () => {
        const callStack: number[] = [];
        const app = await NestFactory.create(AppModule, Router);

        app.get("/", () => {
          callStack.push(3);
          return "hello world";
        });

        @Injectable()
        class GlobalInterceptor implements NestInterceptor {
          async intercept(_ctx: Context, next: Next) {
            callStack.push(1);
            await next();
            callStack.push(2);
          }
        }

        app.useGlobalInterceptors(GlobalInterceptor);

        const port = await getPort();
        await app.listen({ port });

        const res = await fetch(`http://localhost:${port}`);
        assertEquals(res.status, 200);
        assertEquals(await res.text(), "hello world");
        assertEquals(callStack, [3]);
        callStack.length = 0;
        await app.close();
      },
    );

    await t.step(
      "interceptor work with controller",
      async () => {
        const callStack: number[] = [];

        @Controller("")
        class A {
          @Get("/")
          get() {
            callStack.push(5);
            return "hello world";
          }
        }

        @Module({
          controllers: [A],
        })
        class AppModule {}

        const app = await NestFactory.create(AppModule, Router);

        @Injectable()
        class GlobalInterceptor implements NestInterceptor {
          async intercept(_ctx: Context, next: Next) {
            callStack.push(1);
            await next();
            callStack.push(2);
          }
        }

        app.use(async (req, res, next) => {
          callStack.push(3);
          await next();
          callStack.push(4);
          assertEquals(res.status, 200);
        });

        app.useGlobalInterceptors(GlobalInterceptor);

        const port = await getPort();
        await app.listen({ port });

        const res = await fetch(`http://localhost:${port}`);
        assertEquals(res.status, 200);
        assertEquals(await res.text(), "hello world");
        assertEquals(callStack, [3, 1, 5, 2, 4]);
        callStack.length = 0;
        await app.close();
      },
    );
  });

  Deno.test(`${type} use middleware and filter`, {
    sanitizeOps: false,
    sanitizeResources: false,
  }, async (t) => {
    const callStack: number[] = [];

    await t.step("filter works", async () => {
      @Controller("")
      class A {
        @Get("/")
        get() {
          callStack.push(1);
          throw new Error("error");
        }
      }

      @Module({
        controllers: [A],
      })
      class AppModule {}
      const app = await NestFactory.create(AppModule, Router);

      app.use(async (req, res, next) => {
        callStack.push(2);
        await next();
        callStack.push(3);
      });

      @Catch()
      class GlobalFilter implements ExceptionFilter {
        // deno-lint-ignore require-await
        async catch(exception: any, context: Context): Promise<void> {
          callStack.push(4);
          context.response.body = "catched";
        }
      }

      app.useGlobalFilters(GlobalFilter);

      const port = await getPort();
      await app.listen({ port });

      const res = await fetch(`http://localhost:${port}`);
      assertEquals(res.status, 200);
      assertEquals(await res.text(), "catched");
      assertEquals(callStack, [2, 1, 4, 3]);

      callStack.length = 0;
      await app.close();
    });

    await t.step("filter not works when use app.get", async () => {
      @Module({})
      class AppModule {}
      const app = await NestFactory.create(AppModule, Router);

      app.get("/", () => {
        callStack.push(1);
        throw new Error("error");
      });
      app.use(async (req, res, next) => {
        callStack.push(2);
        await next();
        callStack.push(3);
      });

      @Catch()
      class GlobalFilter implements ExceptionFilter {
        // deno-lint-ignore require-await
        async catch(exception: any, context: Context): Promise<void> {
          callStack.push(4);
          context.response.body = "catched";
        }
      }

      app.useGlobalFilters(GlobalFilter);

      const port = await getPort();
      await app.listen({ port });

      const res = await fetch(`http://localhost:${port}`);
      assertEquals(res.status, 500);
      assertEquals(await res.text(), "Internal Server Error");

      if (type === "hono") { // if change app.get and app.use order, the result will be different
        assertEquals(callStack, [1]);
      } else if (type === "oak") {
        assertEquals(callStack, [2, 1]);
      }
      callStack.length = 0;
      await app.close();
    });
  });

  Deno.test(`${type} multi types body`, {
    sanitizeOps: false,
    sanitizeResources: false,
  }, async (t) => {
    await t.step("text", async (it) => {
      const callStack: number[] = [];
      @Module({})
      class AppModule {}

      const { app, baseUrl } = await createApp(AppModule);

      app.get("/", (_, res) => {
        callStack.push(1);
        res.body = "hello world";
        res.headers.set("Content-Type", "text/plain");
        res.headers.set("a", "b");
      });

      await it.step("fetch /", async () => {
        const res = await fetch(`${baseUrl}`);
        assertEquals(res.status, 200);
        assertEquals(await res.text(), "hello world");
        assert(res.headers.get("Content-Type")?.includes("text/plain"));
        assertEquals(res.headers.get("a"), "b");

        assertEquals(callStack, [1]);
        callStack.length = 0;
      });

      await app.close();
    });

    await t.step("json", async (it) => {
      const callStack: number[] = [];
      @Module({})
      class AppModule {}

      const { app, baseUrl } = await createApp(AppModule);

      app.get("/", (_, res) => {
        callStack.push(1);
        res.body = { a: 1 };
        res.headers.set("Content-Type", "application/json");
      });

      await it.step("fetch /", async () => {
        const res = await fetch(`${baseUrl}`);
        assertEquals(res.status, 200);
        assertEquals(await res.json(), { a: 1 });
        assert(res.headers.get("Content-Type")?.includes("application/json"));

        assertEquals(callStack, [1]);
        callStack.length = 0;
      });

      await app.close();
    });

    await t.step("json with object", async (it) => {
      const callStack: number[] = [];
      @Module({})
      class AppModule {}

      const { app, baseUrl } = await createApp(AppModule);

      app.get("/", (_, res) => {
        callStack.push(1);
        res.body = { a: 1 };
      });

      await it.step("fetch /", async () => {
        const res = await fetch(`${baseUrl}`);
        assertEquals(res.status, 200);
        assertEquals(await res.json(), { a: 1 });
        assert(res.headers.get("Content-Type")?.includes("application/json"));

        assertEquals(callStack, [1]);
        callStack.length = 0;
      });

      await app.close();
    });

    await t.step("bool and number be json default", async (it) => {
      const callStack: number[] = [];
      @Module({})
      class AppModule {}

      const { app, baseUrl } = await createApp(AppModule);

      app.get("/", (_, res) => {
        callStack.push(1);
        res.body = 123;
      });

      app.get("/bool", (_, res) => {
        callStack.push(2);
        res.body = true;
      });

      app.get("/boolStr", (_, res) => {
        callStack.push(3);
        res.body = "true";
      });

      await it.step("num maybe json", async () => {
        const res = await fetch(`${baseUrl}`);
        assertEquals(res.status, 200);
        assertEquals(await res.json(), 123);
        assert(
          res.headers.get("Content-Type")?.includes("application/json"),
        );

        assertEquals(callStack, [1]);
        callStack.length = 0;
      });

      await it.step("bool maybe json", async () => {
        const res = await fetch(`${baseUrl}/bool`);
        assertEquals(res.status, 200);
        assertEquals(await res.json(), true);
        assert(
          res.headers.get("Content-Type")?.includes("application/json"),
        );

        assertEquals(callStack, [2]);
        callStack.length = 0;
      });

      await it.step("bool string maybe html", async () => {
        const res = await fetch(`${baseUrl}/boolStr`);
        assertEquals(res.status, 200);
        assertEquals(await res.text(), "true");
        assert(
          res.headers.get("Content-Type")?.includes("text/html"),
        );

        assertEquals(callStack, [3]);
        callStack.length = 0;
      });

      await app.close();
    });
  });

  Deno.test(`${type} request methods`, {
    sanitizeOps: false,
    sanitizeResources: false,
    // only: true,
  }, async (t) => {
    @Module({})
    class AppModule {}

    await t.step("method and url", async () => {
      const callStack: number[] = [];
      const { app, baseUrl } = await createApp(AppModule);
      const baseURL = new URL(baseUrl);

      app.get("/", async (req, res) => {
        callStack.push(1);
        assertEquals(req.method, "GET");
        const url = new URL(req.url);
        assertEquals(url.pathname, baseURL.pathname);
        assert(await req.text() === "");
        res.body = "hello world";
        assertEquals(res.statusText, "OK");
        const originContext = res.getOriginalContext();
        assert(originContext);
      });

      const res = await fetch(`${baseUrl}`);
      assertEquals(res.status, 200);
      assertEquals(await res.text(), "hello world");

      assertEquals(callStack, [1]);
      callStack.length = 0;

      await app.close();
    });

    await t.step("query", async () => {
      const callStack: number[] = [];
      const { app, baseUrl } = await createApp(AppModule);
      const baseURL = new URL(baseUrl);

      app.get("/", async (req, res) => {
        callStack.push(1);
        assertEquals(req.method, "GET");
        const url = new URL(req.url);
        assertEquals(url.pathname, baseURL.pathname);
        assertEquals(req.queries("a"), ["1", "2"]);
        assertEquals(req.queries("b"), ["2"]);
        assertEquals(req.queries("c"), []);
        assertEquals(req.query("a"), "1");
        assertEquals(req.query("b"), "2");
        assert(!req.query("c"));

        const originalRequest = await req.getOriginalRequest();
        assertNotStrictEquals(originalRequest, req);

        res.body = "hello world";
      });

      const res = await fetch(`${baseUrl}?a=1&b=2&a=2`);
      assertEquals(res.status, 200);
      assertEquals(await res.text(), "hello world");

      assertEquals(callStack, [1]);
      callStack.length = 0;
      await app.close();
    });

    await t.step("params", async () => {
      const callStack: number[] = [];
      const { app, baseUrl } = await createApp(AppModule);

      app.get("/user/:id", (req, res) => {
        callStack.push(1);
        assertEquals(req.param("id"), "1");
        assertEquals(req.params(), { id: "1" });

        res.body = "hello world";
      });

      const res = await fetch(`${baseUrl}/user/1`);
      assertEquals(res.status, 200);
      assertEquals(await res.text(), "hello world");

      assertEquals(callStack, [1]);
      callStack.length = 0;
      await app.close();
    });

    await t.step("req headers", async () => {
      const callStack: number[] = [];
      const { app, baseUrl } = await createApp(AppModule);

      app.get("/", (req, res) => {
        callStack.push(1);

        const headers = req.headers();
        assertEquals(headers.get("a"), "3");
        assertEquals(headers.get("b"), "4");
        assertEquals(req.header("a"), "3");
        assertEquals(req.header("b"), "4");
        assert(!req.header("c"));

        res.headers.set("a", "3");
        res.headers.set("c", "4");
        res.body = "hello world";
      });

      const res = await fetch(`${baseUrl}`, {
        headers: {
          a: "3",
          b: "4",
        },
      });
      assertEquals(res.status, 200);
      assertEquals(await res.text(), "hello world");
      assertEquals(res.headers.get("a"), "3");
      assertEquals(res.headers.get("c"), "4");

      assertEquals(callStack, [1]);
      callStack.length = 0;
      await app.close();
    });

    await t.step("cookies response", async () => {
      const callStack: number[] = [];
      const { app, baseUrl } = await createApp(AppModule);

      app.get("/", async (req, res) => {
        callStack.push(1);
        assertEquals(await req.cookies.getAll(), { a: "1", b: "2" });
        assertEquals(await req.cookies.get("a"), "1");
        assertEquals(await req.cookies.get("b"), "2");
        assert(!await req.cookies.get("c"));
        assertEquals(await req.cookies.get("a", { signed: true }), false);
        assertEquals(await req.cookies.has("a"), true);
        assertEquals(await req.cookies.has("c"), false);

        // `Hono` and `oak` default set cookie may not be same
        await res.cookies.set("a", "3", { httpOnly: true, path: "/" });
        await res.cookies.set("c", "4", { httpOnly: true, path: "/" });
        res.cookies.delete("b", { path: "/" });
        res.cookies.delete("d", { path: "/", sameSite: "Lax" });
        await res.cookies.set("e", "5");
        await assertRejects(() => {
          return res.cookies.set("f", "6", { signed: true });
        }, "cookies may be error when no keys and signedKey set");
        res.body = "hello world";
      });

      const res = await fetch(`${baseUrl}`, {
        headers: {
          cookie: "a=1;b=2",
        },
      });
      assertEquals(res.status, 200);
      assertEquals(await res.text(), "hello world");
      // `Hono` response cookie is uppercase, `oak` is lowercase
      const cookies = res.headers.getSetCookie().map((str) =>
        str.toLowerCase()
      );
      assertEquals(cookies[0], "a=3; path=/; httponly");
      assertEquals(cookies[1], "c=4; path=/; httponly");
      assertEquals(cookies[2].startsWith("b=;"), true);
      assertEquals(cookies[3].startsWith("d=;"), true);
      assertEquals(cookies[4].startsWith("e=5"), true);

      assertEquals(callStack, [1]);
      callStack.length = 0;
      await app.close();
    });

    await t.step("cookies signed response", async () => {
      const callStack: number[] = [];
      const oakCookies = [
        "a=3; path=/; httponly",
        "a.sig=W14zAyPtyOtA6FsKT4gSgAn6uE8dDU4RimHHCXqcPHE; path=/; httponly",
        "c=4; path=/; samesite=lax; httponly",
        "c.sig=-_8zuY1JogbWcTrAoyHyjxBiuYWHMtftVvRgR4V99co; path=/; samesite=lax; httponly",
      ];
      const honoCookies = [
        "a=3.iKQ7G4720ukAeXNj2iH9K7KTUdMCI4n%2Bsx%2BxNAqU2uI%3D; Path=/; HttpOnly",
        "c=4.xNz2wML6%2FCO9XuGNsVmcm3gBr62QIRT7qNVMR3p29Qo%3D; Path=/; HttpOnly; SameSite=Lax",
      ];
      const honoCookies2 = [
        "a=3.add.iKQ7G4720ukAeXNj2iH9K7KTUdMCI4n%2Bsx%2BxNAqU2uI%3D; Path=/; HttpOnly",
        "c=4.xNz2wML6%2FCO9XuGNsVmcm3gBr62QIRT7qNVMR3p29Qo%3D.add; Path=/; HttpOnly; SameSite=Lax",
      ];
      const { app, baseUrl } = await createApp(AppModule, {
        keys: ["secret"],
      });

      app.get("/", async (req, res) => {
        callStack.push(1);
        // `Hono` and `oak` default set cookie may not be same
        await res.cookies.set("a", "3", {
          httpOnly: true,
          path: "/",
          signed: true,
        });
        await res.cookies.set("c", "4", {
          httpOnly: true,
          path: "/",
          signed: true,
          signedSecret: "secret2",
          sameSite: "Lax",
        });
        res.body = "hello world";
      });

      app.get("/cookie", async (req, res) => {
        callStack.push(2);
        assertEquals(await res.cookies.get("b"), undefined);
        assertEquals(await res.cookies.get("b", { signed: true }), undefined);
        assertEquals(await res.cookies.get("a", { signed: true }), "3");
        assertEquals(
          await res.cookies.get("c", {
            signed: true,
            signedSecret: "secret2",
          }),
          "4",
        );
        // `Hono` and `oak` default set cookie may not be same
        if (type === "hono") {
          assertEquals(
            await res.cookies.get("a"),
            decodeURIComponent(honoCookies[0].split(";")[0].split("=")[1]),
          );
          assertEquals(
            await res.cookies.get("a", { signed: true, signedSecret: "abcd" }),
            false,
          );
          assertEquals(
            await res.cookies.get("c"),
            decodeURIComponent(honoCookies[1].split(";")[0].split("=")[1]),
          );
          assertEquals(await res.cookies.get("c", { signed: true }), false);
        } else if (type === "oak") {
          assertEquals(await res.cookies.get("a"), "3");
          assertEquals(
            await res.cookies.get("a", { signed: true, signedSecret: "abcd" }), // this is different from hono, it will not check signedSecret
            "3",
          );
          assertEquals(await res.cookies.get("c"), "4");
          assertEquals(await res.cookies.get("c", { signed: true }), "4");
        }
        res.body = "hello world";
      });

      app.get("/lostOakSig", async (req, res) => {
        // only test oak
        callStack.push(3);
        assertEquals(await res.cookies.get("a"), "3");
        assertEquals(await res.cookies.get("a", { signed: true }), false);
        assertEquals(await res.cookies.get("b"), undefined);
        assertEquals(await res.cookies.get("b", { signed: true }), undefined);
        res.body = "hello world";
      });

      app.get("/notRightHono", async (req, res) => {
        // only test hono
        callStack.push(4);
        assertEquals(
          await res.cookies.get("a"),
          decodeURIComponent(honoCookies2[0].split(";")[0].split("=")[1]),
        );
        assertEquals(await res.cookies.get("a", { signed: true }), false);
        assertEquals(
          await res.cookies.get("b"),
          undefined,
        );
        assertEquals(
          await res.cookies.get("c"),
          decodeURIComponent(honoCookies2[1].split(";")[0].split("=")[1]),
        );
        assertEquals(await res.cookies.get("c", { signed: true }), false);
        res.body = "hello world";
      });

      {
        const res = await fetch(`${baseUrl}`);
        assertEquals(res.status, 200);
        assertEquals(await res.text(), "hello world");
        if (type === "oak") {
          assertEquals(res.headers.getSetCookie(), oakCookies);
        } else if (type === "hono") {
          assertEquals(
            res.headers.getSetCookie(),
            honoCookies,
          );
        }
        assertEquals(callStack, [1]);
        callStack.length = 0;
      }

      { // test with cookie
        const res = await fetch(`${baseUrl}/cookie`, {
          headers: {
            "cookie": type === "hono"
              ? honoCookies.join(";")
              : oakCookies.join(";"),
          },
        });
        assertEquals(callStack, [2]);
        assertEquals(res.status, 200);
        assertEquals(await res.text(), "hello world");

        callStack.length = 0;
      }

      if (type === "hono") { // test not right hono sig
        const res = await fetch(`${baseUrl}/notRightHono`, {
          headers: {
            "cookie": honoCookies2.join(";"),
          },
        });
        assertEquals(callStack, [4]);
        assertEquals(res.status, 200);
        assertEquals(await res.text(), "hello world");
        callStack.length = 0;
      }

      if (type === "oak") { // test lost oak sig
        const res = await fetch(`${baseUrl}/lostOakSig`, {
          headers: {
            "cookie": oakCookies[0],
          },
        });
        assertEquals(callStack, [3]);
        assertEquals(res.status, 200);
        assertEquals(await res.text(), "hello world");
        callStack.length = 0;
      }

      callStack.length = 0;
      await app.close();
    });

    await t.step("form", async () => {
      const callStack: number[] = [];

      @Controller("")
      class A {
        @Post("/")
        post(@Form() body: any) {
          callStack.push(1);
          return body;
        }
      }
      @Module({ controllers: [A] })
      class AppModule {}

      const app = await NestFactory.create(AppModule, Router);
      const port = await getPort();
      await app.listen({ port });

      const res = await fetch(`http://localhost:${port}/`, {
        method: "POST",
        body: new URLSearchParams({ a: "1", b: "2" }),
        headers: {
          "content-type": "application/x-www-form-urlencoded",
        },
      });
      assertEquals(callStack, [1]);
      assertEquals(res.status, 200);
      assertEquals(await res.json(), { a: "1", b: "2" });

      callStack.length = 0;
      await app.close();
    });

    await t.step("formdata", async () => {
      const callStack: number[] = [];
      const data = new FormData();
      data.append("a", "1");
      data.append("b", "2");
      data.append("c", new Blob(["hello world"]), "hello.txt");

      @Controller("")
      class A {
        @Post("/")
        post(@Form() body: any) {
          callStack.push(1);
          // console.log(body);
          assert(body);
          assertEquals(body.a, "1");
          assertEquals(body.b, "2");
          assert(body.c instanceof File);
          assertEquals(body.c.name, "hello.txt");
          return "hello world";
        }
      }
      @Module({ controllers: [A] })
      class AppModule {}

      const app = await NestFactory.create(AppModule, Router);
      const port = await getPort();
      await app.listen({ port });

      {
        const res = await fetch(`http://localhost:${port}/`, {
          method: "POST",
          body: data,
        });
        assertEquals(res.status, 200);
        assertEquals(await res.text(), "hello world");
        assertEquals(callStack, [1]);

        callStack.length = 0;
      }

      {
        const res = await fetch(`http://localhost:${port}/`, {
          method: "POST",
          body: JSON.stringify({ a: 1 }),
        });
        assertEquals(res.status, 500);
        await res.body?.cancel();
        assertEquals(callStack, []);
      }

      callStack.length = 0;
      await app.close();
    });
  });

  Deno.test(
    `${type} static serve`,
    { sanitizeOps: false, sanitizeResources: false },
    async (t) => {
      await t.step("static without prefix", async (it) => {
        @Module({ controllers: [] })
        class AppModule {}

        const app = await NestFactory.create(AppModule, Router);
        app.useStaticAssets(`tests/static`);

        const port = await getPort();
        await app.listen({ port });

        await it.step("fetch /", async () => {
          const res = await fetch(`http://localhost:${port}/`);
          assertEquals(res.status, 200);
          assert(res.headers.get("content-type")?.includes("text/html"));
          await res.body?.cancel();
        });

        await it.step("fetch /index.html", async () => {
          const res = await fetch(`http://localhost:${port}/index.html`);
          assertEquals(res.status, 200);
          assert(res.headers.get("content-type")?.includes("text/html"));
          await res.body?.cancel();
        });

        await it.step("fetch /favicon.ico", async () => {
          const res = await fetch(`http://localhost:${port}/favicon.ico`);
          assertEquals(res.status, 200);
          assert(res.headers.get("content-type")?.startsWith("image"));
          await res.body?.cancel();
        });

        await it.step("fetch /child/test.js", async () => {
          const res = await fetch(`http://localhost:${port}/child/test.js`);
          assertEquals(res.status, 200);
          assert(
            res.headers.get("content-type")?.includes("javascript"),
          );
          await res.body?.cancel();
        });

        await it.step("fetch not exist file", async () => {
          const res = await fetch(`http://localhost:${port}/not-exist`);
          assertEquals(res.status, 404);
          await res.body?.cancel();
        });

        await app.close();
      });

      await t.step("static with prefix", async (it) => {
        @Module({ controllers: [] })
        class AppModule {}

        const app = await NestFactory.create(AppModule, Router);
        app.useStaticAssets(`tests/static`, { prefix: "/static" });

        const port = await getPort();
        await app.listen({ port });

        await it.step("fetch /", async () => {
          const res = await fetch(`http://localhost:${port}/`);
          assertEquals(res.status, 404);
          await res.body?.cancel();
        });

        await it.step("fetch /index.html", async () => {
          const res = await fetch(`http://localhost:${port}/index.html`);
          assertEquals(res.status, 404);
          await res.body?.cancel();
        });

        await it.step("fetch /favicon.ico", async () => {
          const res = await fetch(`http://localhost:${port}/favicon.ico`);
          assertEquals(res.status, 404);
          await res.body?.cancel();
        });

        await it.step("fetch /static", async () => {
          const res = await fetch(`http://localhost:${port}/static`);
          assertEquals(res.status, 200);
          assert(res.headers.get("content-type")?.includes("text/html"));
          await res.body?.cancel();
        });

        await it.step("fetch /static/index.html", async () => {
          const res = await fetch(`http://localhost:${port}/static/index.html`);
          assertEquals(res.status, 200);
          assert(res.headers.get("content-type")?.includes("text/html"));
          await res.body?.cancel();
        });

        await it.step("fetch /static/child/test.js", async () => {
          const res = await fetch(
            `http://localhost:${port}/static/child/test.js`,
          );
          assertEquals(res.status, 200);
          assert(
            res.headers.get("content-type")?.includes("javascript"),
          );
          await res.body?.cancel();
        });

        await it.step("fetch not exist file", async () => {
          const res = await fetch(`http://localhost:${port}/static/not-exist`);
          assertEquals(res.status, 404);
          await res.body?.cancel();
        });

        await app.close();
      });

      await t.step("static for not GET", async (it) => {
        @Module({ controllers: [] })
        class AppModule {}

        const app = await NestFactory.create(AppModule, Router);
        app.useStaticAssets(`tests/static`);

        const port = await getPort();
        await app.listen({ port });

        await it.step("fetch /", async () => {
          const res = await fetch(`http://localhost:${port}/`, {
            method: "POST",
          });
          assertEquals(res.status, 404);
          await res.body?.cancel();
        });

        await app.close();
      });

      await t.step("static for has exist router", async (it) => {
        @Controller("")
        class A {
          @Get("/")
          get() {
            return "hello world";
          }
        }

        @Module({ controllers: [A] })
        class AppModule {}

        const app = await NestFactory.create(AppModule, Router);
        app.useStaticAssets(`tests/static`);

        const port = await getPort();
        await app.listen({ port });

        await it.step("fetch /", async () => {
          const res = await fetch(`http://localhost:${port}/`);
          assertEquals(res.status, 200);
          assertEquals(await res.text(), "hello world");
        });

        await app.close();
      });

      await t.step("static for has exist app.get", async (it) => {
        @Module({})
        class AppModule {}

        const app = await NestFactory.create(AppModule, Router);
        app.useStaticAssets(`tests/static`);

        app.get("/", (_, res) => {
          res.body = "hello world";
        });

        const port = await getPort();
        await app.listen({ port });

        await it.step("fetch /", async () => {
          const res = await fetch(`http://localhost:${port}/`);
          assertEquals(res.status, 200);
          assertEquals(await res.text(), "hello world");
        });

        await app.close();
      });

      await t.step(
        "static for status not 404, will not into static",
        async (it) => {
          @Controller("")
          class A {
            @Get("/")
            get() {
              throw new BadRequestException("error");
            }
          }

          @Module({ controllers: [A] })
          class AppModule {}

          const app = await NestFactory.create(AppModule, Router);
          app.useStaticAssets(`tests/static`);

          const port = await getPort();
          await app.listen({ port });

          await it.step("fetch /", async () => {
            const res = await fetch(`http://localhost:${port}/`, {
              method: "GET",
            });
            assertEquals(res.status, 400);
            assertEquals(await res.json(), {
              error: "Bad Request",
              message: "error",
              statusCode: 400,
            });
          });

          await app.close();
        },
      );
    },
  );

  Deno.test(`${type} APP_FILTER use global filter`, {
    sanitizeOps: false,
    sanitizeResources: false,
  }, async (t) => {
    const callStack: number[] = [];

    @Injectable()
    class A {}

    @Injectable()
    class B {
      @Get("/")
      b() {
        throw new BadRequestException("b error");
      }
    }

    @Catch(HttpException)
    class AppFilter implements ExceptionFilter {
      constructor(private readonly a: A) {
        assert(a instanceof A);
      }
      // deno-lint-ignore require-await
      async catch(exception: HttpException, context: Context): Promise<void> {
        callStack.push(2);
        context.response.status = exception.status;
        context.response.body = {
          statusCode: exception.status,
          message: exception.message,
        };
      }
    }

    @Module({
      controllers: [B],
      providers: [{
        provide: APP_FILTER,
        useClass: AppFilter,
      }],
    })
    class AppModule {}

    await t.step("filter should work as global", async () => {
      const { app, port } = await createApp(AppModule);

      const res = await fetch(`http://localhost:${port}/`, {
        method: "GET",
      });
      assertEquals(res.status, 400);
      assertEquals(await res.json(), {
        message: "b error",
        statusCode: 400,
      });

      await app.close();
    });
  });

  Deno.test(`${type} APP_GUARD use global guard`, {
    sanitizeOps: false,
    sanitizeResources: false,
  }, async (t) => {
    const callStack: number[] = [];

    @Injectable()
    class B {
      b() {
        callStack.push(2);
        return this.c(); // test this
      }
      c() {
        return "c";
      }
    }

    @Injectable()
    class Guard implements CanActivate {
      constructor(private readonly b: B) {
        callStack.push(1);
        assert(b instanceof B);
      }

      // deno-lint-ignore require-await
      async canActivate(_context: Context): Promise<boolean> {
        callStack.push(3);
        assertEquals(this.b.b(), "c");
        return true;
      }
    }

    @Controller("")
    class A {
      @Get("/a")
      method1() {
        callStack.push(4);
        return "a";
      }
    }

    @Module({
      controllers: [A],
      providers: [{
        provide: APP_GUARD,
        useClass: Guard,
      }],
    })
    class AppModule {}

    await t.step("guard should work as global", async () => {
      const { app, port } = await createApp(AppModule);
      assertEquals(callStack, [1]);

      const res = await fetch(`http://localhost:${port}/a`);
      assertEquals(res.status, 200);
      assertEquals(await res.text(), "a");
      assertEquals(callStack, [1, 3, 2, 4]);

      await app.close();
    });
  });

  Deno.test(`${type} APP_INTERCEPTOR use global interceptor`, {
    sanitizeOps: false,
    sanitizeResources: false,
  }, async () => {
    const callStack: number[] = [];

    @Injectable()
    class B {
      b() {
        callStack.push(1);
        return this.c(); // test this
      }
      c() {
        return "c";
      }
    }

    @Controller("")
    class A {
      @Get("/a")
      method1() {
        callStack.push(2);
        return "a";
      }
    }

    @Injectable()
    class GlobalInterceptor implements NestInterceptor {
      constructor(private readonly b: B) {
        callStack.push(3);
        assert(b instanceof B);
      }

      async intercept(_ctx: Context, next: Next) {
        callStack.push(4);
        assertEquals(this.b.b(), "c");
        await next();
        callStack.push(5);
      }
    }

    @Module({
      controllers: [A],
      providers: [{
        provide: APP_INTERCEPTOR,
        useClass: GlobalInterceptor,
      }],
    })
    class AppModule {}

    const app = await NestFactory.create(AppModule, Router);

    const port = await getPort();
    await app.listen({ port });

    const res = await fetch(`http://localhost:${port}/a`);
    assertEquals(res.status, 200);
    assertEquals(await res.text(), "a");
    assertEquals(callStack, [3, 4, 1, 2, 5]);
    callStack.length = 0;
    await app.close();
  });

  Deno.test(
    `${type} redirect`,
    { sanitizeOps: false, sanitizeResources: false },
    async (t) => {
      const callStack: number[] = [];

      @Controller("")
      class A {
        @Get("/a")
        redirect(@Res() res: Response) {
          callStack.push(1);
          res.redirect(REDIRECT_BACK);
        }

        @Get("/b")
        redirect2(@Res() res: Response) {
          callStack.push(2);
          res.redirect("https://www.baidu.com");
        }

        @Get("/c")
        redirect3(@Res() res: Response) {
          callStack.push(3);
          res.redirect("https://www.baidu.com", 301);
        }
      }

      @Module({
        controllers: [A],
      })
      class AppModule {}
      const { app, baseUrl } = await createApp(AppModule);

      await t.step("fetch a", async () => {
        const res = await fetch(`${baseUrl}/a`, {
          redirect: "manual",
        });
        assertEquals(callStack, [1]);
        assertEquals(res.status, 302);
        assertEquals(res.headers.get("location"), baseUrl);
        await res.body?.cancel();
        callStack.length = 0;
      });

      await t.step("fetch b", async () => {
        const res = await fetch(`${baseUrl}/b`, {
          redirect: "manual",
        });
        assertEquals(callStack, [2]);
        assertEquals(res.status, 302);
        assertEquals(res.headers.get("location"), "https://www.baidu.com");
        await res.body?.cancel();
        callStack.length = 0;
      });

      await t.step("fetch c", async () => {
        const res = await fetch(`${baseUrl}/c`, {
          redirect: "manual",
        });
        assertEquals(callStack, [3]);
        assertEquals(res.status, 301);
        assertEquals(res.headers.get("location"), "https://www.baidu.com");
        await res.body?.cancel();
        callStack.length = 0;
      });

      await app.close();
    },
  );
}
