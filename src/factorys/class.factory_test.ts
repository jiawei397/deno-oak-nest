import { assert, assertEquals, assertRejects } from "../../test_deps.ts";
import { Reflect } from "../../deps.ts";
import { Injectable } from "../decorators/inject.ts";
import { Scope } from "../interfaces/scope-options.interface.ts";
import { Factory, initProvider, META_CONTAINER_KEY } from "./class.factory.ts";

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

  @Injectable({
    singleton: false,
  })
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

  const a1 = await Factory(A);
  assert(a1.getB() === a.getB(), "Factory should return the same instance");
  assert(a1.getC() !== a.getC(), "c should be different instance");

  assertEquals(Reflect.getMetadata(META_CONTAINER_KEY, a), undefined);
  assertEquals(Reflect.getMetadata(META_CONTAINER_KEY, a.getB()), undefined);
  assert(Reflect.getMetadata(META_CONTAINER_KEY, a.getC()) === a);
  assert(Reflect.getMetadata(META_CONTAINER_KEY, a1.getC()) === a1);
});

Deno.test("initProvider", async () => {
  class A {
  }

  const a = await initProvider(A);
  assert(a instanceof A);

  const c = await initProvider(A, Scope.REQUEST);
  assert(c !== a);

  const d = await initProvider(A, Scope.TRANSIENT);
  assert(d !== a);

  { // useExisting
    const provider = {
      provide: "a",
      useExisting: A,
    };
    const b = await initProvider(provider);
    assert(b === a);

    const provider2 = {
      provide: "b",
      useExisting: "a",
    };
    const e = await initProvider(provider2);
    assert(e === a);

    const provider3 = {
      provide: "c",
      useExisting: "d",
    };
    await assertRejects(
      () => initProvider(provider3),
    ); // Cannot find provider for "d".
  }

  { // use value
    const provider = {
      provide: "a",
      useValue: "b",
    };
    const b = await initProvider(provider);
    assertEquals(b, provider.useValue);
  }

  { // use class
    const provider = {
      provide: "a",
      useClass: A,
    };
    const b = await initProvider(provider);
    assert(b === a);

    class B {}
    const provider2 = {
      provide: "b",
      useClass: B,
    };
    const e = await initProvider(provider2);
    assert(e instanceof B);
  }

  { // use factory
    const provider = {
      provide: "a",
      useFactory: () => "b",
    };
    const b = await initProvider(provider);
    assertEquals(b, provider.useFactory());
  }
});
