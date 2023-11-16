import { getInjectData, Inject, Injectable, isSingleton } from "./inject.ts";
import { assert, assertEquals } from "../../tests/test_deps.ts";
import { factory } from "../factorys/class.factory.ts";
import { Scope } from "../interfaces/scope-options.interface.ts";
import { Controller } from "./controller.ts";

Deno.test("Inject alone", () => {
  const injectKey = "injectKey";
  const InjectModel = Inject(injectKey);
  const test = {};
  InjectModel(test, "", 0);

  const result = getInjectData(test, 0);
  assertEquals(result, injectKey);
});

Deno.test("Inject with providerInit", async () => {
  const callStack: number[] = [];
  const InjectModel = (name: string) => Inject(() => name + "1");

  @Injectable()
  class A {
    constructor(
      @InjectModel("a") public a: string,
      @InjectModel("b") public b: string,
    ) {
      callStack.push(1);
      assertEquals(a, "a1");
      assertEquals(b, "b1");
    }
  }

  await factory.initProvider(A);

  assertEquals(callStack, [1]);

  factory.globalCaches.clear();
});

Deno.test("Inject with controller", async () => {
  const callStack: number[] = [];
  const InjectModel = (name: string) => Inject(() => name + "1");

  @Controller("")
  class A {
    constructor(
      @InjectModel("a") public a: string,
      @InjectModel("b") public b: string,
    ) {
      callStack.push(1);
      assertEquals(a, "a1");
      assertEquals(b, "b1");
    }
  }

  const a1 = await factory.create(A);
  assert(a1 instanceof A);
  assertEquals(callStack, [1]);

  factory.globalCaches.clear();
});

Deno.test("Injectable singleton false", async (t) => {
  @Injectable({
    scope: Scope.TRANSIENT,
  })
  class A {}

  await t.step("check instance", async () => {
    const a1 = await factory.create(A);
    assert(a1 instanceof A);
    const a2 = await factory.create(A);
    assert(a2 instanceof A);
    assert(a1 !== a2, "A should return different instance");
  });

  factory.globalCaches.clear();
});

Deno.test("isSingleton", async (t) => {
  await t.step("not singleton", () => {
    @Injectable({
      scope: Scope.TRANSIENT,
    })
    class A {}

    assertEquals(isSingleton(A), false);
  });

  await t.step("singleton", () => {
    @Injectable()
    class A {}

    assertEquals(isSingleton(A), true);
  });

  await t.step("singleton default", () => {
    class A {}

    assertEquals(isSingleton(A), true);
  });

  await t.step("singleton not function", () => {
    class A {}

    const a = new A();
    // deno-lint-ignore no-explicit-any
    assertEquals(isSingleton(a as any), true);
  });
});
