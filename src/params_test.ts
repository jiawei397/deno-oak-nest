import { Context } from "../deps.ts";
import { assertEquals, testing } from "../test_deps.ts";
import { Controller, Get } from "./decorators/controller.ts";
import {
  createParamDecorator,
  createParamDecoratorWithLowLevel,
} from "./params.ts";
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

Deno.test("createParamDecoratorWithLowLevel", async () => {
  const callStack: number[] = [];
  const aResult = "body";

  const Headers = () =>
    createParamDecoratorWithLowLevel((_ctx: Context) => {
      callStack.push(1);
      return 2;
    });

  @Controller("user")
  class A {
    @Get("a")
    a(@Headers() headers: number) {
      callStack.push(headers);
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

Deno.test("transferParam", async () => {
  const callStack: number[] = [];
  const aResult = "body";

  const Headers = () =>
    createParamDecoratorWithLowLevel((_ctx: Context) => {
      callStack.push(1);
      return 2;
    });

  const Body = createParamDecorator((_ctx: Context) => {
    callStack.push(3);
    return 4;
  });
  const ctx = testing.createMockContext({
    path: "/user/a",
    method: "GET",
  });

  @Controller("user")
  class A {
    @Get("a")
    a(
      @Headers() headers: number,
      context: Context,
      @Body() body: number,
      context2: Context,
    ) {
      assertEquals(ctx, context);
      assertEquals(ctx, context2);
      callStack.push(headers);
      callStack.push(body);
      callStack.push(5);
      return aResult;
    }
  }

  const router = new Router();
  await router.add(A);

  const mw = router.routes();
  const next = testing.createMockNext();

  await mw(ctx, next);
  assertEquals(ctx.response.body, aResult);
  assertEquals(callStack, [1, 3, 2, 4, 5]);
});
