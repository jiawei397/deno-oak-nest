import { assert, assertEquals } from "../../tests/test_deps.ts";
import { DynamicModule } from "../interfaces/module.interface.ts";
import {
  defineModuleMetadata,
  getModuleMetadata,
  Global,
  isGlobalModule,
  isModule,
  Module,
  onModuleInit,
} from "./module.ts";

Deno.test("isModule", () => {
  assert(!isModule(true));
  assert(!isModule(false));
  assert(!isModule(""));
  assert(!isModule("string"));
  assert(!isModule({}));
  assert(isModule({
    module: "",
  }));

  const module = {};
  defineModuleMetadata(module);

  assert(isModule(module));
});

Deno.test("Module", () => {
  class A {
  }
  class B {
  }

  const providers = [B, {
    provide: "b",
    useValue: "b",
  }, {
    provide: "c",
    useFactory: () => "d",
  }];

  @Module({})
  class AsyncModule {
    static register(): DynamicModule {
      return {
        module: AsyncModule,
        providers: [{
          provide: "async1",
          useFactory: () => { // can be async
            return Promise.resolve(true);
          },
        }],
      };
    }
  }

  @Module({
    imports: [AsyncModule],
    controllers: [A],
    providers,
  })
  class ModuleA {
  }

  assert(isModule(ModuleA));

  assertEquals(getModuleMetadata("imports", ModuleA), [AsyncModule]);
  assertEquals(getModuleMetadata("controllers", ModuleA), [A]);
  assertEquals(getModuleMetadata("providers", ModuleA), providers);
});

Deno.test("onModuleInit", async (t) => {
  await t.step("has onModuleInit", () => {
    const callStack: number[] = [];
    class AppService {
      onModuleInit() {
        callStack.push(1);
      }
    }

    const appService = new AppService();
    onModuleInit(appService);
    assertEquals(callStack, [1]);

    onModuleInit(appService);
    assertEquals(callStack, [1], "should not call onModuleInit twice");
  });

  await t.step("has not onModuleInit", () => {
    const callStack: number[] = [];
    class AppService {}

    const appService = new AppService();
    onModuleInit(appService);
    assertEquals(callStack, []);
  });
});

Deno.test("global module", async (t) => {
  await t.step("not global module", () => {
    @Module({})
    class NotGlobalModule {
    }

    assert(isModule(NotGlobalModule));
    assert(!isGlobalModule(NotGlobalModule));
  });

  await t.step("isGlobalModule", () => {
    @Global()
    @Module({})
    class GlobalModule {
    }

    assert(isModule(GlobalModule));
    assert(isGlobalModule(GlobalModule));
  });

  await t.step("isGlobalModule with dynamic module and global", () => {
    @Module({})
    class AsyncModule {
      static register(): DynamicModule {
        return {
          module: AsyncModule,
          global: true,
        };
      }
    }

    const module = AsyncModule.register();
    assert(isModule(module));
    assert(isGlobalModule(module));
  });

  await t.step("isGlobalModule with dynamic module and not global", () => {
    @Module({})
    class AsyncModule {
      static register(): DynamicModule {
        return {
          module: AsyncModule,
        };
      }
    }

    const module = AsyncModule.register();
    assert(isModule(module));
    assert(!isGlobalModule(module));
  });
});
