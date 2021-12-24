import { assert, assertEquals } from "../../test_deps.ts";
import { Scope } from "../interfaces/scope-options.interface.ts";
import { Factory } from "./class.factory.ts";

Deno.test("Factory without providers", async () => {
  class A {
  }

  const a = await Factory(A);

  assert(a instanceof A);

  const b = await Factory(A);
  assertEquals(a, b, "Factory should return the same instance");

  const c = await Factory(A, Scope.REQUEST);
  assert(a !== c, "Factory should return different instance");

  const d = await Factory(A, Scope.TRANSIENT);
  assert(a !== d, "Factory should return different instance");
});

Deno.test("Factory with providers", async () => {
  const Controller = (): ClassDecorator => () => {};

  class B {
  }

  class C {
  }

  @Controller()
  class A {
    constructor(private readonly b: B, private readonly c: C) {}

    getB() {
      return this.b;
    }

    getC() {
      return this.c;
    }
  }

  const a = await Factory(A);
  assert(a.getB());
  assert(a.getB() instanceof B);
  assert(a.getC());
  assert(a.getC() instanceof C);
});
