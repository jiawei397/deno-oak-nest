import { getInjectData, Inject, Injectable } from "./inject.ts";
import { assert, assertEquals } from "../../test_deps.ts";
import { Factory, initProvider } from "../factorys/class.factory.ts";
import { Scope } from "../interfaces/scope-options.interface.ts";
import { Controller } from "./controller.ts";
import { Router } from "../router.ts";

Deno.test("Inject alone", () => {
  const injectKey = "injectKey";
  const InjectModel = Inject(injectKey);
  const test = {};
  InjectModel(test, "", 0);

  const result = getInjectData(test, 0);
  assertEquals(result, injectKey);
});

Deno.test("Inject with proviverInit", async () => {
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

  await initProvider(A, Scope.DEFAULT);

  assertEquals(callStack, [1]);
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

  const router = new Router();
  await router.register(A);
  assertEquals(callStack, [1]);
});

Deno.test("Injectable singleton false", async (t) => {
  @Injectable({
    singleton: false,
  })
  class A {}

  await t.step("check instance", async () => {
    const a1 = await Factory(A);
    assert(a1 instanceof A);
    const a2 = await Factory(A);
    assert(a2 instanceof A);
    assert(a1 !== a2, "A should return different instance");
  });
});
