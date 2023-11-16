// deno-lint-ignore-file no-explicit-any
import {
  assert,
  assertEquals,
  assertNotEquals,
  assertRejects,
} from "../../tests/test_deps.ts";
import { Inject, Injectable } from "../decorators/inject.ts";
import { Scope } from "../interfaces/scope-options.interface.ts";
import { factory } from "./class.factory.ts";
import { INQUIRER } from "../constants.ts";
import { type Constructor } from "../interfaces/type.interface.ts";
import { Controller, Get, Post } from "../decorators/controller.ts";

Deno.test("factory.create without providers", async (t) => {
  class A {
  }

  const a = await factory.create(A);

  await t.step("base", async () => {
    assert(a instanceof A);

    const b = await factory.create(A);
    assertEquals(a, b, "factory.create should return the same instance");

    const c = await factory.create(A, { caches: new Map() });
    assert(a === c, "cache will find in global if not found");
  });

  await t.step("transient", async () => {
    // const c = await factory.create(A, Scope.REQUEST);
    // assert(a !== c, "factory.create should return different instance");
    const d = await factory.create(A, { scope: Scope.TRANSIENT });
    assert(a !== d, "factory.create should return different instance");
  });

  await t.step("get different instance with new caches", async () => {
    factory.globalCaches.clear();

    const a1 = await factory.create(A, { caches: new Map() });
    assert(a1 !== a);

    const a2 = await factory.create(A);
    assert(a1 !== a2);
  });

  factory.globalCaches.clear();
});

Deno.test("factory.create with providers", async () => {
  factory.globalCaches.clear();

  const Controller = (): ClassDecorator => () => {};

  const callStack: number[] = [];

  @Injectable({
    scope: Scope.TRANSIENT,
  })
  class C {
    constructor(@Inject(INQUIRER) private parentClass: Constructor) {
      callStack.push(1);
    }

    getParent() {
      return this.parentClass;
    }
  }

  const scope = {
    name: "bcd",
  };
  const obj = {
    fn: function (...args: string[]) {
      return (this as unknown as typeof scope).name + args.join("");
    },
    scope,
    params: ["a", "e"],
  };

  @Injectable()
  class B {
    constructor(public readonly c: C, @Inject(obj) public readonly d: string) {
      callStack.push(2);
    }
  }

  @Controller()
  class A {
    constructor(public readonly b: B, public readonly c: C) {}
  }

  const a = await factory.create(A);
  assert(a.b);
  assert(a.b instanceof B);
  assert(a.c);
  assert(a.c instanceof C);
  assert(a.b.c instanceof C);
  assertNotEquals(a.b.c, a.c);
  assertEquals(a.c.getParent(), A, "C should record the parent class A");
  assertEquals(a.b.c.getParent(), B, "C should record the parent class B");
  assertEquals(a.b.d, "bcdae", "should call the fn");

  assertEquals(callStack, [1, 1, 2]);

  const a1 = await factory.create(A);
  assert(a === a1, "factory.create should return the same instance");
  assert(a.b === a1.b, "B should return the same instance");
  assert(a.c === a1.c, "C should return the same instance");

  assertEquals(callStack, [1, 1, 2]);

  factory.globalCaches.clear();
});

Deno.test("factory getInstance", async () => {
  await assertRejects(() => factory.getInstance(null as any));
  await assertRejects(() => factory.getInstance(undefined as any));
  await assertRejects(() => factory.getInstance("a" as any));
  await assertRejects(() => factory.getInstance(true as any));
});

Deno.test("initProvider", async (t) => {
  factory.globalCaches.clear();

  class A {
  }

  const a = await factory.initProvider(A);
  assert(a instanceof A);

  await t.step("initProvider with self map", async () => {
    const a1 = await factory.initProvider(A, { caches: new Map() });
    assert(a1 instanceof A);
    assert(a1 === a, "will found in global");
  });

  await t.step("initProvider with scope", async () => {
    // const c = await initProvider(A, Scope.REQUEST);
    // assert(c !== a);

    const d = await factory.initProvider(A, { scope: Scope.TRANSIENT });
    assert(d !== a);
  });

  await t.step("useExisting", async () => {
    const provider = {
      provide: "a",
      useExisting: A,
    };
    const b = await factory.initProvider(provider);
    assert(b === a);

    const provider2 = {
      provide: "b",
      useExisting: "a",
    };
    const e = await factory.initProvider(provider2);
    assert(e === a);

    const provider3 = {
      provide: "c",
      useExisting: "d",
    };
    await assertRejects(
      () => factory.initProvider(provider3),
    ); // Cannot find provider for "d".
  });

  await t.step("useValue", async () => {
    const provider = {
      provide: "a",
      useValue: "b",
    };
    const b = await factory.initProvider(provider);
    assertEquals(b, provider.useValue);
  });

  await t.step("useClass", async () => {
    const provider = {
      provide: "a",
      useClass: A,
    };
    const b = await factory.initProvider(provider);
    assert(b === a);

    class B {}
    const provider2 = {
      provide: "b",
      useClass: B,
    };
    const e = await factory.initProvider(provider2);
    assert(e instanceof B);
  });

  await t.step("useFactory", async () => {
    const provider = {
      provide: "a",
      useFactory: () => "b",
    };
    const b = await factory.initProvider(provider);
    assertEquals(b, provider.useFactory());
  });

  await t.step("useFactory with inject", async () => {
    const callStack: number[] = [];
    const provider = {
      provide: "a",
      useFactory: (b: string) => {
        callStack.push(1);
        assertEquals(b, "b");
        return "c";
      },
      inject: ["b"],
    };
    const res = await factory.initProvider(provider);
    assertEquals(res, "c");
    assertEquals(callStack, [1]);
  });

  await t.step("useFactory with inject class", async () => {
    const callStack: number[] = [];
    class B {}
    const provider = {
      provide: "a",
      useFactory: (b: B) => {
        callStack.push(1);
        assert(b instanceof B);
        return "c";
      },
      inject: [B],
    };
    const res = await factory.initProvider(provider);
    assertEquals(res, "c");
    assertEquals(callStack, [1]);
  });

  await t.step("useFactory with inject optional is true", async () => {
    const callStack: number[] = [];
    class B {}
    const provider = {
      provide: "a",
      useFactory: (b: B, c?: string) => {
        callStack.push(1);
        assert(b instanceof B);
        assertEquals(c, undefined);
        return "c";
      },
      inject: [
        // { provide: "SomeOptionalProvider", useValue: "anything" },
        B,
        { token: "SomeOptionalProvider", optional: true },
      ],
    };
    const res = await factory.initProvider(provider);
    assertEquals(res, "c");
    assertEquals(callStack, [1]);
  });

  await t.step("useFactory with inject optional is false", async () => {
    class B {}
    const provider = {
      provide: "a",
      // deno-lint-ignore no-unused-vars
      useFactory: (b: B, c?: string) => {
        assert(false, "not reached");
      },
      inject: [
        // { provide: "SomeOptionalProvider", useValue: "anything" },
        B,
        { token: "SomeOptionalProvider", optional: false },
      ],
    };
    await assertRejects(() => factory.initProvider(provider));
  });

  await t.step("useFactory with inject optional works", async () => {
    const callStack: number[] = [];
    const someOptionalProvider = {
      provide: "SomeOptionalProvider",
      useValue: "anything",
    };
    const res1 = await factory.initProvider(someOptionalProvider);
    assertEquals(res1, someOptionalProvider.useValue);

    class B {}
    const provider = {
      provide: "a",
      useFactory: (b: B, c?: string) => {
        callStack.push(1);
        assert(b instanceof B);
        assertEquals(c, someOptionalProvider.useValue);
        return "c";
      },
      inject: [
        B,
        { token: "SomeOptionalProvider", optional: false },
      ],
    };
    const res = await factory.initProvider(provider);
    assertEquals(res, "c");
    assertEquals(callStack, [1]);
  });
});

Deno.test("mapRoute without controller route", async () => {
  class A {
    @Get("/a")
    method1() {}

    @Post("/b")
    method2() {}
  }

  const result = await factory.mapRoute(A);
  assert(Array.isArray(result));
  assertEquals(result.length, 2);

  const map1 = result[0];
  assert(map1);
  assertEquals(map1.methodPath, "/a");
  assertEquals(map1.methodName, "method1");
  assertEquals(map1.methodType, "get");
  assert(map1.instance instanceof A);
  assertEquals(map1.cls, A);

  const map2 = result[1];
  assert(map2);
  assertEquals(map2.methodPath, "/b");
  assertEquals(map2.methodName, "method2");
  assertEquals(map2.methodType, "post");
  assert(map2.instance instanceof A);
  assertEquals(map2.cls, A);

  assertEquals(map1.instance, map2.instance, "instance should be same");

  // clear
  factory.globalCaches.clear();
});

Deno.test("mapRoute with controller route", async () => {
  @Controller("/user")
  class A {
    name = "abcd";

    @Get("/a")
    method1() {}

    @Post("/b")
    method2() {}
  }

  const result = await factory.mapRoute(A);
  assert(Array.isArray(result));
  assertEquals(result.length, 2);

  result.forEach((item) => {
    assert(item);
    assert(
      !item.methodPath.startsWith("/user/"),
      'should not start with "/user/", this function not deal with controller route',
    );
  });

  // clear
  factory.globalCaches.clear();
});

Deno.test("getRouterArr", async (t) => {
  class A {
    @Get("/a")
    method1() {}
  }

  await t.step("one Class", async () => {
    factory.globalCaches.clear();

    const result = await factory.getRouterArr([A]);
    assert(Array.isArray(result));
    assertEquals(result.length, 1);
    assert(result[0]);
    assertEquals(result[0].controllerPath, "/");

    const arr = result[0].arr;
    assert(Array.isArray(arr));
    assertEquals(arr.length, 1);
    assertEquals(arr[0].methodPath, "/a");
    assertEquals(arr[0].methodName, "method1");
  });

  await t.step("multi Class", async () => {
    factory.globalCaches.clear();

    class B {
      @Get("/b")
      method2() {}

      @Get("/c")
      method3() {}
    }

    const result = await factory.getRouterArr([A, B]);
    assertEquals(result.length, 2, "should add new controller");
    assertEquals(result[1].arr.length, 2);
  });

  // clear
  factory.globalCaches.clear();
});
