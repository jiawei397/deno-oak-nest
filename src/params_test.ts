import { Context } from "../deps.ts";
import { assertEquals, testing } from "../test_deps.ts";
import { Controller, Get } from "./decorators/controller.ts";
import { createParamDecorator } from "./params.ts";
import { Router } from "./router.ts";

Deno.test("createParamDecorator", async () => {
  const callStack: number[] = [];
  const aResult = "body";
  const Body = createParamDecorator((_ctx: Context) => {
    callStack.push(1);
    return 2;
  });

  @Controller("user")
  class A {
    @Get("a")
    a(@Body() body: number) {
      callStack.push(body);
      callStack.push(3);
      return aResult;
    }
  }

  const router = new Router();
  await router.add(A);
  const ctx = testing.createMockContext({
    path: "/user/a",
    method: "GET",
  });

  const mw = router.routes();
  const next = testing.createMockNext();

  await mw(ctx, next);
  assertEquals(ctx.response.body, aResult);
  assertEquals(callStack, [1, 2, 3]);
});
