// deno-lint-ignore-file no-unused-vars no-explicit-any
import { assert, assertEquals } from "../../test_deps.ts";
import { createMockApp, MockRouter } from "../../tests/common_helper.ts";
import { Application } from "../application.ts";
import { Module } from "../decorators/module.ts";
import type {
  Provider,
  RegisteredProvider,
  SpecialProvider,
} from "../interfaces/provider.interface.ts";
import type { Type } from "../interfaces/type.interface.ts";
import { findControllers, initProviders, NestFactory } from "./nest.factory.ts";

Deno.test("NestFactory", async () => {
  @Module({
    imports: [],
    controllers: [],
  })
  class AppModule {}

  const app = await NestFactory.create(AppModule, MockRouter);
  assert(app instanceof Application);
  assert(app.setGlobalPrefix);
  assert(app.useGlobalInterceptors);
  assert(app.use);
  assert(app.get);
});

Deno.test("findControllers", async () => {
  const callStack: number[] = [];

  const controllerArr: Type<any>[] = [];
  const registeredProviderArr: RegisteredProvider[] = [];
  const dynamicProviders: Provider[] = [];
  const specialProviders: SpecialProvider[] = [];
  const Controller = (): ClassDecorator => () => {};

  class ChildService {}

  @Controller()
  class ChildController {
    constructor(private readonly childService: ChildService) {}
  }

  @Module({
    imports: [],
    controllers: [
      ChildController,
    ],
  })
  class ChildModule {}

  class AppService {}

  class SchedulerService {
    onModuleInit() {
      callStack.push(1);
    }
  }

  @Controller()
  class AppController {
    constructor(private readonly appService: AppService) {}
  }

  @Module({
    imports: [ChildModule],
    controllers: [
      AppController,
    ],
    providers: [SchedulerService],
  })
  class AppModule {}

  await findControllers(
    AppModule,
    controllerArr,
    registeredProviderArr,
    dynamicProviders,
    specialProviders,
  );

  assertEquals(controllerArr.length, 2);
  assertEquals(controllerArr[0], AppController);
  assertEquals(controllerArr[1], ChildController);

  assertEquals(registeredProviderArr.length, 1);
  assertEquals(registeredProviderArr[0], SchedulerService);

  assertEquals(dynamicProviders.length, 0);

  assertEquals(specialProviders.length, 0);

  const app = createMockApp();
  await initProviders(registeredProviderArr, app);
  assertEquals(callStack, [1]);

  await initProviders(registeredProviderArr, app);
  assertEquals(callStack, [1], "should not call onModuleInit twice");
});
