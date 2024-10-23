import { Controller } from "@nest/core";
import { assert, createTestingModule } from "@nest/tests";
import { LoggerService } from "./logger.service.ts";
import { assertEquals } from "std/assert/assert_equals.ts";

Deno.test("logger service test", async () => {
  @Controller("")
  class A {
    constructor(private loggerService: LoggerService) {}
  }

  @Controller("")
  class B {
    constructor(private loggerService: LoggerService) {}
  }

  const moduleRef = await createTestingModule({
    controllers: [A, B],
  }).compile();
  const loggerService = await moduleRef.get(LoggerService, A);
  const loggerService2 = await moduleRef.get(LoggerService, B);

  assert(loggerService);
  assert(loggerService2);
  assert(loggerService instanceof LoggerService);
  assert(loggerService2 instanceof LoggerService);
  assertEquals(loggerService.parentName, "A");
  assertEquals(loggerService2.parentName, "B");
  assert(loggerService !== loggerService2, "service is not singleton");
});
