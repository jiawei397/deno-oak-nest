import { assert, assertEquals } from "../../tests/test_deps.ts";
import {
  createMockContext,
  mockCallMethod,
  MockRouter,
} from "../../tests/common_helper.ts";
import { Application } from "../application.ts";
import { Get, Post } from "../decorators/controller.ts";
import { Module } from "../decorators/module.ts";
import { NestFactory } from "./nest.factory.ts";

Deno.test("NestFactory", async () => {
  @Module({
    imports: [],
    controllers: [],
  })
  class AppModule {}

  const app = await NestFactory.create(AppModule, MockRouter);
  assert(app instanceof Application);
});

Deno.test("add with prefix", async (t) => {
  const callStack: number[] = [];

  const Controller = (): ClassDecorator => () => {};

  @Controller()
  class A {
    @Get("/a")
    method1() {
      callStack.push(1);
    }

    @Post("/b")
    method2() {
      callStack.push(2);
    }
  }

  @Module({
    imports: [],
    controllers: [A],
  })
  class AppModule {}

  await t.step("test get", async () => {
    const app = await NestFactory.create(AppModule, MockRouter);
    app.setGlobalPrefix("/api");

    const context = createMockContext({
      path: "/api/a",
      method: "GET",
    });
    await mockCallMethod(app, context);

    assertEquals(callStack, [1]);

    callStack.length = 0;
  });

  await t.step("test post", async () => {
    const app = await NestFactory.create(AppModule, MockRouter);
    app.setGlobalPrefix("api");
    const context = createMockContext({
      path: "/api/b",
      method: "POST",
    });
    await mockCallMethod(app, context);

    assertEquals(callStack, [2]);

    callStack.length = 0;
  });
});
