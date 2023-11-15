# log

We use [date_log](https://deno.land/x/date_log@v1.1.1/mod.ts) to record our
logs.

## example

Add import map in `deno.json`:

```json
{
  "imports": {
    "@nest": "https://deno.land/x/deno_nest@v3.8.1/mod.ts",
    "@nest/hono": "https://deno.land/x/deno_nest@v3.8.1/modules/hono/mod.ts",
    "hono/": "https://deno.land/x/hono@v3.9.1/",
    "std/": "https://deno.land/std@0.202.0/",
    "date_log": "https://deno.land/x/date_log@v1.1.1/mod.ts"
  }
}
```

`log.ts` init log and add a `non-singleton` class Logger:

```ts
// deno-lint-ignore-file no-explicit-any
import { type Constructor, Inject, Injectable, INQUIRER, Scope } from "@nest";
import { getLogger, initLog } from "date_log";
import globals from "./globals.ts";

initLog(globals.log);

export const logger = getLogger();

@Injectable({
  scope: Scope.TRANSIENT,
})
export class Logger {
  private parentName?: string;

  constructor(@Inject(INQUIRER) private parentClass: Constructor) {
    this.parentName = this.parentClass.name;
  }

  private write(
    methodName: "warning" | "info" | "debug" | "error",
    ...messages: any[]
  ): void {
    if (this.parentName) {
      logger[methodName](this.parentName, ...messages);
    } else {
      const [first, ...others] = messages;
      logger[methodName](first, ...others);
    }
  }

  debug(...messages: any[]): void {
    this.write("debug", ...messages);
  }

  info(...messages: any[]): void {
    this.write("info", ...messages);
  }

  warn(...messages: any[]): void {
    this.write("warning", ...messages);
  }

  error(...messages: any[]): void {
    this.write("error", ...messages);
  }
}
```

You can `logger` in main.ts:

```ts
import { NestFactory } from "@nest";
import { Router } from "@nest/hono";
import { AppModule } from "./app.module.ts";
import { logger } from "./log.ts";

const app = await NestFactory.create(AppModule, Router);

const port = Number(Deno.env.get("PORT") || 2000);
app.listen({
  port,
  onListen: ({ hostname, port }) =>
    logger.info(`Listening on http://${hostname}:${port}`),
});
```

Then use `Logger` in `app.controller.ts` as `Provider`:

```ts
import { Controller, Get } from "@nest";
import { Logger } from "./log.ts";

@Controller("")
export class AppController {
  constructor(private logger: Logger) {}

  @Get("/")
  hello() {
    this.logger.info("hello world");
    return "Hello World!";
  }
}
```

Once you start your app and get `http://localhost/`, you will see the log in
`logs` dir, it may be:

```log
2023-11-09 15:52:08 [INFO] - Listening on http://localhost:2000
2023-11-09 15:53:05 [INFO] - [AppController] hello world
```
