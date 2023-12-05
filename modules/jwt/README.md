# nest_jwt_module

This is a `jwt` module for [`deno_nest`](https://deno.land/x/deno_nest).

## example

Add import map in `deno.json`:

```json
{
  "imports": {
    "@nest": "https://deno.land/x/deno_nest@v3.11.0/mod.ts",
    "@nest/hono": "https://deno.land/x/deno_nest@v3.11.0/modules/hono/mod.ts",
    "@nest/jwt": "https://deno.land/x/deno_nest@v3.11.0/modules/jwt/mod.ts",
    "hono/": "https://deno.land/x/hono@v3.11.1/"
  }
}
```

Then use in `AppModule`:

```typescript
import { Module } from "@nest";
import { AppController } from "./app.controller.ts";
import { JwtModule } from "@nest/jwt";

@Module({
  imports: [JwtModule.register({
    global: true,
    secret:
      "DO NOT USE THIS VALUE. INSTEAD, CREATE A COMPLEX SECRET AND KEEP IT SAFE OUTSIDE OF THE SOURCE CODE.",
    signOptions: {
      expiresIn: 60,
    },
  })],
  controllers: [AppController],
})
export class AppModule {}
```

Then `JwtService` can be used in any Controllers.

````ts
import { Body, Controller, Get, Post } from "@nest";
import { JwtService } from "@nest/jwt";

@Controller("")
export class AppController {
  constructor(private readonly jwtService: JwtService) {}

  @Get("/")
  async sign() {
    const value = await this.jwtService.sign({ foo: "bar" });
    return {
      value,
    };
  }

  /**
   * verify token, if token is invalid or expired, will throw error
   * @example
   * ```js
   * fetch("http://localhost:2000/verify", {
   *    method: "POST",
   *    headers: {
   *      "Content-Type": "application/json",
   *    },
   *    body: JSON.stringify({
   *      token: "eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJmb28iOiJiYXIiLCJleHAiOjE3MDE3NDcwODR9.7aTW8sz54U_ToUysTyXaOMBXK6PM3uWErNorh2fbBvyCq0nrR3O6MxJrL_FyYGuZhpvjKHaJJXOwjcXaDZyosw"
   *    }),
   * })
   * ```
   */
  @Post("/verify")
  async verify(@Body() body: { token: string }) {
    const payload = await this.jwtService.verify(body.token);
    return {
      payload,
    };
  }
}
````

More can see the example dir.
