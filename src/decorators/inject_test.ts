import { getInjectData, Inject, Injectable } from "./inject.ts";
import { assertEquals } from "../../test_deps.ts";
import { initProvider } from "../factorys/class.factory.ts";
import { Scope } from "../interfaces/scope-options.interface.ts";

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
