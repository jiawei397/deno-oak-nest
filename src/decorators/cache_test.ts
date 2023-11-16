// deno-lint-ignore-file require-await
import {
  assert,
  assertEquals,
  assertRejects,
  delay,
} from "../../tests/test_deps.ts";
import { Cache, clearCacheTimeout } from "./cache.ts";

Deno.test("cache hit", async () => {
  const callStacks: number[] = [];

  class A {
    @Cache(200)
    async method(id: number) {
      callStacks.push(id);
      await delay(10);
      return id;
    }

    @Cache(100)
    async method2(id: number) {
      callStacks.push(id);
      await delay(10);
      return id;
    }
  }

  const a = new A();

  Deno.env.set("DEBUG", "true");

  const p1 = a.method(1);
  const p2 = a.method(1);
  const p3 = a.method(2);
  assertEquals(callStacks, [1, 2]);
  assert(p1 === p2);

  const p4 = a.method2(1);
  const p5 = a.method2(1);
  assertEquals(callStacks, [1, 2, 1]);
  assert(p4 === p5);

  assertEquals(await p1, 1);
  assertEquals(await p2, 1);
  assertEquals(await p3, 2);
  assertEquals(await p4, 1);
  assertEquals(await p5, 1);

  await delay(200);
  callStacks.length = 0;

  const p6 = a.method(1);
  assertEquals(callStacks, [1]);
  await p6;

  clearCacheTimeout();

  Deno.env.delete("DEBUG");
});

Deno.test("self key", async () => {
  const callStacks: number[] = [];

  class A {
    @Cache(200, (id) => `${id + 123}`)
    method(id: number) {
      callStacks.push(1);
      return id;
    }

    @Cache(200, (id) => `${id + 123}`)
    method2(id: number) {
      callStacks.push(2);
      return id;
    }

    @Cache(100, (id) => `${id + "a"}`)
    async method3(id: number) {
      callStacks.push(3);
      return id;
    }

    @Cache(100, (id) => `${id + "a"}`)
    async method4(id: number) {
      callStacks.push(4);
      return id;
    }
  }

  const a = new A();
  const p1 = a.method(1);
  const p2 = a.method(1);
  assert(p1 === p2);
  assertEquals(callStacks, [1]);

  const p3 = a.method2(1);
  assert(p3 === p2);
  assertEquals(callStacks, [1, 2]);

  const p4 = a.method3(1);
  const p5 = a.method3(1);
  assert(p4 === p5);
  assertEquals(callStacks, [1, 2, 3]);

  const p6 = a.method4(1);
  assert(p6 !== p4);
  assertEquals(callStacks, [1, 2, 3, 4]);
  assertEquals(await p4, await p6);

  clearCacheTimeout();
});

Deno.test("method params is object, key will use params", async () => {
  const callStacks: number[] = [];

  interface User {
    a: number;
  }

  class A {
    @Cache(200)
    method(id: number, _obj: User) {
      callStacks.push(1);
      return id;
    }
  }

  const a = new A();
  const p1 = a.method(1, { a: 1 });
  const p2 = a.method(1, { a: 1 });
  assert(p1 === p2);
  assertEquals(callStacks, [1]);

  const p3 = a.method(1, { a: 2 });
  assert(p3 === p2);
  assertEquals(callStacks, [1, 1]);

  clearCacheTimeout();
});

Deno.test("method throw error, will not cache", async () => {
  const callStacks: number[] = [];

  class A {
    @Cache(200)
    method(id: number) {
      callStacks.push(1);
      if (id === 1) {
        throw new Error("id is 1");
      }
      return id;
    }
  }

  const a = new A();
  let error;
  try {
    a.method(1);
  } catch (e) {
    error = e;
  }
  assert(error);
  assertEquals(callStacks, [1]);

  error = null;
  try {
    a.method(1);
  } catch (err) {
    error = err;
  }
  assert(error);
  assertEquals(callStacks, [1, 1]);

  clearCacheTimeout();
});

Deno.test("method reject promise, will not cache", async () => {
  const callStacks: number[] = [];

  class A {
    @Cache(200)
    method(_id: number) {
      callStacks.push(1);
      return Promise.reject("error");
    }
  }

  const a = new A();
  await assertRejects(() => a.method(1));
  assertEquals(callStacks, [1]);

  await assertRejects(() => a.method(1));
  assertEquals(callStacks, [1, 1]);

  clearCacheTimeout();
});

Deno.test("clearCache", async () => {
  const callStacks: number[] = [];
  const cacheKey = "test";
  class A {
    @Cache(1000 * 60 * 60, () => cacheKey)
    method(id: number) {
      callStacks.push(1);
      return id;
    }
  }

  const a = new A();
  const p1 = a.method(1);
  const p2 = a.method(1);
  assert(p1 === p2);
  assertEquals(callStacks, [1]);

  dispatchEvent(new CustomEvent("clearCache_" + cacheKey));

  const p3 = a.method(1);
  assert(p3 === p1);
  assertEquals(callStacks, [1, 1]);

  clearCacheTimeout();
});
