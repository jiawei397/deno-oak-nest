import { assertEquals } from "../tests/test_deps.ts";
import {
  createMockApp,
  createMockContext,
  mockCallMethod,
} from "../tests/common_helper.ts";
import { Controller, Get } from "./decorators/controller.ts";
import { type Context } from "./interfaces/context.interface.ts";
import {
  createParamDecorator,
  createParamDecoratorWithLowLevel,
} from "./params.ts";

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

  const app = createMockApp();
  app.addController(A);

  const ctx = createMockContext({
    path: "/user/a",
    method: "GET",
  });

  await mockCallMethod(app, ctx);

  assertEquals(ctx.response.body, aResult);
  assertEquals(callStack, [1, 2, 3]);
});

Deno.test("createParamDecoratorWithLowLevel", async () => {
  const callStack: number[] = [];
  const aResult = "body";

  const Header = () =>
    createParamDecoratorWithLowLevel((_ctx: Context) => {
      callStack.push(1);
      return 2;
    });

  @Controller("user")
  class A {
    @Get("a")
    a(@Header() header: number) {
      callStack.push(header);
      callStack.push(3);
      return aResult;
    }
  }

  const app = createMockApp();
  app.addController(A);
  const ctx = createMockContext({
    path: "/user/a",
    method: "GET",
  });

  await mockCallMethod(app, ctx);

  assertEquals(ctx.response.body, aResult);
  assertEquals(callStack, [1, 2, 3]);
});

Deno.test("transferParam", async () => {
  const callStack: number[] = [];
  const aResult = "body";

  const Header = () =>
    createParamDecoratorWithLowLevel((_ctx: Context) => {
      callStack.push(1);
      return 2;
    });

  const Body = createParamDecorator((_ctx: Context) => {
    callStack.push(3);
    return 4;
  });
  const ctx = createMockContext({
    path: "/user/a",
    method: "GET",
  });

  @Controller("user")
  class A {
    @Get("a")
    a(
      @Header() header: number,
      context: Context,
      @Body() body: number,
      context2: Context,
    ) {
      assertEquals(ctx, context);
      assertEquals(ctx, context2);
      callStack.push(header);
      callStack.push(body);
      callStack.push(5);
      return aResult;
    }
  }

  const app = createMockApp();
  app.addController(A);
  await mockCallMethod(app, ctx);

  assertEquals(ctx.response.body, aResult);
  assertEquals(callStack, [1, 3, 2, 4, 5]);
});
