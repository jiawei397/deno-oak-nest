// deno-lint-ignore-file no-unused-vars
import { assert, assertEquals } from "../tests/test_deps.ts";
import { Module } from "./decorators/module.ts";
import type {
  CollectResult,
  DynamicModule,
  ModuleType,
} from "./interfaces/module.interface.ts";
import {
  collectModuleDeps,
  getChildModuleArr,
  isClassProvider,
  isExistingProvider,
  isFactoryProvider,
  isSpecialProvider,
  isValueProvider,
  sortModuleDeps,
} from "./module.ts";

Deno.test("isSpecialProvider", () => {
  assertEquals(isSpecialProvider(Symbol("test")), false);
  assert(
    isSpecialProvider({
      provide: "test",
      useValue: "test",
    }),
  );
});

Deno.test("collect", async (t) => {
  const moduleMap = new Map<ModuleType, CollectResult>();

  const Controller = (): ClassDecorator => () => {};

  class AsyncService {}

  @Module({})
  class AsyncModule {
    static register(): DynamicModule {
      return {
        module: AsyncModule,
        providers: [AsyncService, {
          provide: "async1",
          useFactory: () => { // can be async
            return Promise.resolve(true);
          },
        }],
      };
    }
  }

  class ChildService {}

  @Controller()
  class ChildController {
    constructor(private readonly childService: ChildService) {}
  }

  @Module({
    imports: [AsyncModule],
    controllers: [
      ChildController,
    ],
  })
  class ChildModule {}

  class AppService {}

  class SchedulerService {}

  @Controller()
  class AppController {
    constructor(private readonly appService: AppService) {}
  }

  @Module({
    imports: [ChildModule, AsyncModule.register()],
    controllers: [
      AppController,
    ],
    providers: [SchedulerService, {
      provide: "value",
      useValue: "test",
    }, {
      provide: "factory",
      useFactory: () => {
        return "factory";
      },
    }, {
      provide: "existing",
      useExisting: "value",
    }, {
      provide: "class",
      useClass: ChildService,
    }],
  })
  class AppModule {}

  await collectModuleDeps(
    AppModule,
    moduleMap,
  );

  await t.step("module deps", () => {
    assertEquals(moduleMap.size, 3);
  });

  await t.step("app module", () => {
    const appModule = moduleMap.get(AppModule);
    assert(appModule);

    assertEquals(appModule.childModuleArr.length, 2);
    assertEquals(appModule.childModuleArr, [ChildModule, AsyncModule]);

    assertEquals(appModule.controllerArr.length, 1);
    assertEquals(appModule.controllerArr[0], AppController);
    assertEquals(appModule.providerArr.length, 5);
    assert(isSpecialProvider(appModule.providerArr[0]));
    assert(isValueProvider(appModule.providerArr[0]));
    assertEquals(appModule.providerArr[0].provide, "value");

    assert(isSpecialProvider(appModule.providerArr[1]));
    assert(isFactoryProvider(appModule.providerArr[1]));

    assert(!isSpecialProvider(appModule.providerArr[2])); // SchedulerService
    assert(!isClassProvider(appModule.providerArr[2]));

    assert(isSpecialProvider(appModule.providerArr[3]));
    assert(isClassProvider(appModule.providerArr[3]));
    assertEquals(appModule.providerArr[3].useClass, ChildService);

    assert(isSpecialProvider(appModule.providerArr[4]));
    assert(isExistingProvider(appModule.providerArr[4]));
  });

  await t.step("child module", () => {
    const childModule = moduleMap.get(ChildModule);
    assert(childModule);
    assertEquals(childModule.childModuleArr.length, 1);
    assertEquals(childModule.childModuleArr[0], AsyncModule);
    assertEquals(childModule.controllerArr.length, 1);
    assertEquals(childModule.controllerArr[0], ChildController);
    assertEquals(childModule.providerArr.length, 0);
  });

  await t.step("async module", () => {
    const asyncModule = moduleMap.get(AsyncModule);
    assert(asyncModule);
    assertEquals(asyncModule.childModuleArr.length, 0);
    assertEquals(asyncModule.controllerArr.length, 0);
    assertEquals(asyncModule.providerArr.length, 2);
    assert(isFactoryProvider(asyncModule.providerArr[0]));
    assert(!isSpecialProvider(asyncModule.providerArr[1]));
  });
});

Deno.test("collect module order", async (t) => {
  class DynService {}

  @Module({})
  class DynModule {
    static register(): DynamicModule {
      return {
        module: DynModule,
        providers: [DynService],
      };
    }
  }

  await t.step("collectModuleDeps not module", async () => {
    class AppModule {}
    const moduleMap = new Map<ModuleType, CollectResult>();
    const res = await collectModuleDeps(
      AppModule,
      moduleMap,
    );
    assertEquals(res, null);
    assertEquals(moduleMap.size, 0);
  });

  await t.step("module deps", async () => {
    @Module({
      imports: [DynModule.register()],
    })
    class ChildModule {}

    @Module({
      imports: [ChildModule, DynModule.register()],
    })
    class AppModule {}

    const moduleMap = new Map<ModuleType, CollectResult>();
    await collectModuleDeps(
      AppModule,
      moduleMap,
    );
    assertEquals(moduleMap.size, 3);

    const moduleDepsArr = sortModuleDeps(moduleMap);
    assertEquals(moduleDepsArr.length, 3);
    assertEquals(moduleDepsArr, [DynModule, ChildModule, AppModule]);
  });

  await t.step("module deps2", async () => {
    @Module({})
    class ChildModule {}

    @Module({
      imports: [ChildModule, DynModule.register()],
    })
    class AppModule {}

    const moduleMap = new Map<ModuleType, CollectResult>();
    await collectModuleDeps(
      AppModule,
      moduleMap,
    );
    assertEquals(moduleMap.size, 3);

    const moduleDepsArr = sortModuleDeps(moduleMap);
    assertEquals(moduleDepsArr.length, 3);
    assertEquals(moduleDepsArr, [ChildModule, DynModule, AppModule]);
  });

  await t.step("module deps3 complex", async () => {
    @Module({
      imports: [],
    })
    class ChildModule {}

    @Module({
      imports: [ChildModule],
    })
    class ChildModule2 {}

    @Module({
      imports: [ChildModule2, DynModule],
    })
    class ChildModule3 {}

    @Module({
      imports: [ChildModule2],
    })
    class ChildModule4 {}

    @Module({
      imports: [ChildModule4, ChildModule3, DynModule.register()],
    })
    class AppModule {}

    const moduleMap = new Map<ModuleType, CollectResult>();
    await collectModuleDeps(
      AppModule,
      moduleMap,
    );

    const moduleDepsArr = sortModuleDeps(moduleMap);

    assertEquals(moduleMap.size, 6);
    assertEquals(moduleDepsArr.length, 6);
    assertEquals(moduleDepsArr, [
      ChildModule,
      ChildModule2,
      ChildModule4,
      DynModule,
      ChildModule3,
      AppModule,
    ]);
  });
});

Deno.test("getChildModuleArr", () => {
  const moduleDepsMap: Map<ModuleType, CollectResult> = new Map();
  const module = class TestModule {};
  const arr = getChildModuleArr(moduleDepsMap, module);
  assertEquals(arr, []);
});
