import { assert, assertEquals } from "../../test_deps.ts";
import {
  defineModuleMetadata,
  getModuleMetadata,
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

  @Module({
    imports: ["a", "b"],
    controllers: [A],
    providers,
  })
  class ModuleA {
  }

  assert(isModule(ModuleA));

  assertEquals(getModuleMetadata("imports", ModuleA), ["a", "b"]);
  assertEquals(getModuleMetadata("controllers", ModuleA), [A]);
  assertEquals(getModuleMetadata("providers", ModuleA), providers);
});

Deno.test("onModuleInit", () => {
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
