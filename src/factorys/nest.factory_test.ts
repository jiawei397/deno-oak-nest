// deno-lint-ignore-file no-unused-vars no-explicit-any
import { assert, assertEquals } from "../../test_deps.ts";
import { createMockApp, MockRouter } from "../../tests/common_helper.ts";
import { Application } from "../application.ts";
import { Module } from "../decorators/module.ts";
import { ModuleType, OnModuleInit } from "../interfaces/module.interface.ts";
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

  const moduleArr: ModuleType[] = [];
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
    moduleArr,
    controllerArr,
    registeredProviderArr,
    dynamicProviders,
    specialProviders,
  );

  assertEquals(moduleArr.length, 2);
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

Deno.test("module init", async (t) => {
  const callStack: number[] = [];

  const Controller = (): ClassDecorator => () => {};
  const Injectable = (): ClassDecorator => () => {};

  @Injectable()
  class ChildService implements OnModuleInit {
    onModuleInit() {
      callStack.push(1);
    }
  }

  @Controller()
  class ChildController {
    constructor(private readonly childService: ChildService) {
    }

    onModuleInit() {
      callStack.push(2);
    }
  }

  @Injectable()
  class AppService {
    onModuleInit() {
      callStack.push(4);
    }
  }

  @Injectable()
  class SchedulerService {
    onModuleInit() {
      callStack.push(5);
    }
  }

  @Controller()
  class AppController {
    constructor(private readonly appService: AppService) {}
    onModuleInit() {
      callStack.push(6);
    }
  }

  await t.step("module without providers", async () => {
    @Module({
      imports: [],
      controllers: [
        ChildController,
      ],
    })
    class ChildModule {
      onModuleInit() {
        callStack.push(3);
      }
    }

    @Module({
      imports: [ChildModule],
      controllers: [
        AppController,
      ],
      providers: [SchedulerService],
    })
    class AppModule {}

    await NestFactory.create(AppModule, MockRouter, {
      cache: new Map(),
    });

    assertEquals(
      callStack,
      [5, 6, 2, 3],
      "because no provider, so no call 1, 4",
    );

    callStack.length = 0;
  });

  await t.step("module with providers", async () => {
    @Module({
      imports: [],
      controllers: [
        ChildController,
      ],
      providers: [
        ChildService,
      ],
    })
    class ChildModule {
      onModuleInit() {
        callStack.push(3);
      }
    }

    @Module({
      imports: [ChildModule],
      controllers: [
        AppController,
      ],
      providers: [SchedulerService, AppService],
    })
    class AppModule {}

    await NestFactory.create(AppModule, MockRouter, {
      cache: new Map(),
    });

    console.log("module inited", callStack);
    assertEquals(
      callStack,
      [5, 4, 1, 6, 2, 3],
    );

    callStack.length = 0;
  });
});
