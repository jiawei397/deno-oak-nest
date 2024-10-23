import {
  assert,
  assertEquals,
  assertRejects,
  createMockContext,
  createTestingModule,
  delay,
} from "@nest/tests";
import {
  CacheInterceptor,
  CacheKey,
  CacheTTL,
  SetCachePolicy,
  SetCacheStore,
} from "./cache.interceptor.ts";
import { KVStore, MemoryStore } from "./cache.store.ts";
import { Controller, Get, Post, UseInterceptors } from "@nest/core";
import { CacheModule } from "./cache.module.ts";

Deno.test("CacheInterceptor initStore", async (t) => {
  await t.step("onModuleInit default", async () => {
    const interceptor = new CacheInterceptor();
    await interceptor.onModuleInit();

    assert(interceptor.memoryCache);

    assert(true);
  });

  await t.step("initStore localStorage", async () => {
    const interceptor = new CacheInterceptor();
    await interceptor.initStore("localStorage");
    assert(
      interceptor.cacheMap.get("localStorage"),
    );
  });

  await t.step("initStore LRU", async () => {
    const interceptor = new CacheInterceptor();
    await interceptor.initStore("LRU");
    assert(
      interceptor.cacheMap.get("LRU"),
    );
  });

  await t.step("initStore KVStore", async () => {
    const interceptor = new CacheInterceptor();
    await interceptor.initStore("KVStore");
    const caches = interceptor.cacheMap.get("KVStore") as KVStore;
    assert(caches);
    caches.close();
  });

  await t.step("initStore KVStore, with key", async () => {
    const interceptor = new CacheInterceptor({
      kvStoreBaseKey: "test",
    });
    await interceptor.initStore("KVStore");
    const caches = interceptor.cacheMap.get("KVStore") as KVStore;
    assert(caches);
    caches.close();
  });

  await t.step("onModuleInit with store function", async () => {
    const interceptor = new CacheInterceptor({
      store: () => ({
        name: "test",
        store: new MemoryStore(),
      }),
    });
    await interceptor.onModuleInit();
    const caches = interceptor.cacheMap.get("test") as MemoryStore;
    assert(caches);
  });

  await t.step("onModuleInit with store object", async () => {
    const store = new MemoryStore();
    const interceptor = new CacheInterceptor({
      store: {
        name: "test",
        store,
      },
    });
    await interceptor.onModuleInit();
    const caches = interceptor.cacheMap.get("test") as MemoryStore;
    assert(caches);
    assert(caches === store);
  });
});

Deno.test("CacheInterceptor getCaches", async (t) => {
  await t.step("getCaches with no decorator function", async () => {
    const interceptor = new CacheInterceptor();
    const { storeName, caches } = await interceptor.getCaches(() => {});
    assertEquals(caches, undefined);
    assertEquals(storeName, undefined);
  });

  await t.step("getCaches with localStorage", async () => {
    const interceptor = new CacheInterceptor();

    class A {
      @SetCacheStore("localStorage")
      a() {}
    }
    const { storeName, caches } = await interceptor.getCaches(A.prototype.a);
    assert(caches);
    assert(storeName === "localStorage");
    assert(caches === interceptor.cacheMap.get("localStorage"));
  });

  await t.step("getCaches with memory", async () => {
    const interceptor = new CacheInterceptor();

    class A {
      @SetCacheStore("memory")
      a() {}
    }
    const { caches, storeName } = await interceptor.getCaches(A.prototype.a);
    assert(caches);
    assert(caches === interceptor.cacheMap.get("memory"));
    assertEquals(storeName, "memory");
  });

  await t.step("getCaches with storeName not exist", async () => {
    const interceptor = new CacheInterceptor();

    class A {
      @SetCacheStore("memory2")
      a() {}
    }

    const { storeName, caches } = await interceptor.getCaches(A.prototype.a);
    assertEquals(storeName, "memory2");
    assertEquals(caches, undefined);
  });
});

Deno.test("setPolicy", async (t) => {
  await t.step("setPolicy private", () => {
    const callStack: number[] = [];
    const interceptor = new CacheInterceptor();
    const context = createMockContext({
      method: "GET",
      path: "http://localhost",
    });
    @Controller("")
    class A {
      @Get("/")
      @SetCachePolicy("private")
      a() {
        callStack.push(1);
        return "hello";
      }
    }
    interceptor.setCacheHeaderByPolicy(
      A.prototype.a,
      context,
    );
    const cacheControl = context.response.headers.get("Cache-Control");
    assert(cacheControl);
    assert(cacheControl.includes("private"));
  });

  await t.step("setPolicy private with ttl", () => {
    const interceptor = new CacheInterceptor();
    const context = createMockContext({
      method: "GET",
      path: "http://localhost",
    });
    class A {
      @SetCachePolicy("private")
      a() {
      }
    }
    interceptor.setCacheHeaderByPolicy(
      A.prototype.a,
      context,
      60,
    );
    const cacheControl = context.response.headers.get("Cache-Control");
    assert(cacheControl);
    assert(cacheControl.includes("private"));
    assert(cacheControl.includes("max-age=60"));
  });

  await t.step("setPolicy public", () => {
    const interceptor = new CacheInterceptor();
    const context = createMockContext({
      method: "GET",
      path: "http://localhost",
    });
    class A {
      @SetCachePolicy("public")
      a() {
      }
    }
    interceptor.setCacheHeaderByPolicy(
      A.prototype.a,
      context,
    );
    const cacheControl = context.response.headers.get("Cache-Control");
    assert(cacheControl);
    assert(cacheControl.includes("public"));
  });

  await t.step("setPolicy no-cache", () => {
    const interceptor = new CacheInterceptor();
    const context = createMockContext({
      method: "GET",
      path: "http://localhost",
    });
    class A {
      @SetCachePolicy("no-cache")
      a() {
      }
    }
    interceptor.setCacheHeaderByPolicy(
      A.prototype.a,
      context,
    );
    const cacheControl = context.response.headers.get("Cache-Control");
    assert(cacheControl);
    assert(cacheControl.includes("no-cache"));
  });
});

Deno.test("log", async (t) => {
  await t.step("log with no debug", () => {
    const interceptor = new CacheInterceptor();
    interceptor.log("hello");
  });

  await t.step("log with debug", () => {
    const interceptor = new CacheInterceptor({
      isDebug: true,
    });
    interceptor.log("hello");
  });
});

Deno.test("CacheInterceptor joinArgs", async (t) => {
  await t.step("joinArgs with no args", () => {
    const interceptor = new CacheInterceptor();
    const result = interceptor.joinArgs([]);
    assertEquals(result, "");
  });

  await t.step("joinArgs with args", () => {
    const interceptor = new CacheInterceptor();
    const result = interceptor.joinArgs([1, "2", true]);
    assertEquals(result, "1_2_true");
  });

  await t.step("joinArgs with object", () => {
    const interceptor = new CacheInterceptor();
    const result = interceptor.joinArgs([{ a: 1 }]);
    assertEquals(result, '{"a":1}');
  });
});

Deno.test("getCacheKeyByOptions", async (t) => {
  await t.step("getCacheKeyByOptions with no decorator", () => {
    class A {
      a() {}
    }
    const a = new A();
    const interceptor = new CacheInterceptor();
    const result = interceptor.getCacheKeyByOptions({
      target: a,
      methodName: "a",
      methodType: "get",
      args: [],
      fn: A.prototype.a,
      next: () => {},
    });
    assertEquals(result, "684c8a7406524d88bdd3d4d6e9c88b99");
  });

  await t.step("getCacheKeyByOptions with CacheKey", () => {
    const interceptor = new CacheInterceptor();
    class A {
      @CacheKey("test")
      a() {}
    }
    const result = interceptor.getCacheKeyByOptions({
      target: new A(),
      methodName: "a",
      methodType: "get",
      args: [],
      fn: A.prototype.a,
      next: () => {},
    });
    assertEquals(result, "test");
  });

  await t.step("getCacheKeyByOptions with getCacheKey", () => {
    const interceptor = new CacheInterceptor({
      getCacheKey: () => "test",
    });
    class A {
      a() {}
    }
    const result = interceptor.getCacheKeyByOptions({
      target: new A(),
      methodName: "a",
      methodType: "get",
      args: [],
      fn: A.prototype.a,
      next: () => {},
    });
    assertEquals(result, "test");
  });
});

Deno.test("response with other store", {
  sanitizeOps: false,
  sanitizeResources: false,
  // only: true,
}, async (t) => {
  const callStacks: number[] = [];
  const interceptor = new CacheInterceptor({
    ttl: 10,
    store: "LRU",
    max: 100,
    // isDebug: true,
    maxSize: 100000,
  });
  await interceptor.onModuleInit();

  const context = createMockContext({
    method: "GET",
    path: "http://localhost",
  });
  const next = async () => {
    callStacks.push(1);
    await delay(100);
    context.response.body = "hello";
  };

  class A {
    a() {}
  }
  const target = new A();
  const options = {
    target,
    args: [],
    methodName: "a",
    methodType: "get",
    fn: target.a,
    next,
  };

  await t.step("first", async () => {
    await interceptor.intercept(
      context,
      next,
      options,
    );
    assertEquals(callStacks, [1]);
    assertEquals(context.response.body, "hello");
    callStacks.length = 0;
  });

  await t.step("second should use LRU cache", async () => {
    await interceptor.intercept(
      context,
      next,
      options,
    );
    assertEquals(callStacks, []);
    assertEquals(context.response.body, "hello");
    callStacks.length = 0;
  });
});

Deno.test("response with other store, but sync", {
  sanitizeOps: false,
  sanitizeResources: false,
  // only: true,
}, async (t) => {
  const callStacks: number[] = [];
  const interceptor = new CacheInterceptor({
    ttl: 10,
    store: "LRU",
    max: 100,
    maxSize: 100000,
  });
  await interceptor.onModuleInit();

  const context = createMockContext({
    method: "GET",
    path: "http://localhost",
  });
  const next = () => {
    callStacks.push(1);
    context.response.body = "hello";
  };

  class A {
    a() {}
  }
  const target = new A();
  const options = {
    target,
    args: [],
    methodName: "a",
    methodType: "get",
    fn: target.a,
    next,
  };

  await t.step("first", async () => {
    await interceptor.intercept(
      context,
      next,
      options,
    );
    assertEquals(callStacks, [1]);
    assertEquals(context.response.body, "hello");
    callStacks.length = 0;
  });

  await delay(100);

  // should use LRU cache
  await t.step("second", async () => {
    await interceptor.intercept(
      context,
      next,
      options,
    );
    assertEquals(callStacks, [1], "sync not work");
    assertEquals(context.response.body, "hello");
    callStacks.length = 0;
  });
});

Deno.test("CacheInterceptor intercept", {
  sanitizeOps: false,
  sanitizeResources: false,
  // only: true,
}, async (t) => {
  await t.step("intercept with not GET method", async () => {
    const callStacks: number[] = [];
    const interceptor = new CacheInterceptor();
    await interceptor.onModuleInit();
    const context = createMockContext({
      method: "OPTIONS",
      path: "https://pan.baidu.com/a",
    });
    const next = () => {
      callStacks.push(1);
    };

    @Controller("")
    class A {
      @Post("/")
      a() {}
    }
    const target = new A();
    const options = {
      target,
      args: [],
      methodName: "a",
      methodType: "post",
      fn: target.a,
      next,
    };
    await interceptor.intercept(
      context,
      next,
      options,
    );
    assertEquals(callStacks, [1]);
  });

  await t.step(
    "intercept with GET method, return result in context",
    async () => {
      const callStacks: number[] = [];
      const interceptor = new CacheInterceptor({
        ttl: 1,
      });
      await interceptor.onModuleInit();

      const context = createMockContext({
        method: "GET",
        path: "http://localhost",
      });
      const next = () => {
        callStacks.push(1);
        context.response.body = "hello";
      };

      class A {
        a() {}
      }
      const target = new A();
      const options = {
        target,
        args: [],
        methodName: "a",
        methodType: "get",
        fn: target.a,
        next,
      };
      await interceptor.intercept(
        context,
        next,
        options,
      );
      assertEquals(callStacks, [1]);
      assertEquals(context.response.body, "hello");

      await interceptor.intercept(
        context,
        next,
        options,
      );
      assertEquals(callStacks, [1]);
      assertEquals(context.response.body, "hello");

      await delay(1000);
      await interceptor.intercept(
        context,
        next,
        options,
      );
      assertEquals(callStacks, [1, 1]);
      assertEquals(context.response.body, "hello");
    },
  );

  await t.step(
    "intercept with GET method, return async result in context",
    async () => {
      const callStacks: number[] = [];
      const interceptor = new CacheInterceptor({
        ttl: 1,
      });
      await interceptor.onModuleInit();

      const context = createMockContext({
        method: "GET",
        path: "http://localhost",
      });
      const next = async () => {
        callStacks.push(1);
        await delay(100);
        context.response.body = "hello";
      };

      class A {
        a() {}
      }
      const target = new A();
      const options = {
        target,
        args: [],
        methodName: "a",
        methodType: "get",
        fn: target.a,
        next,
      };
      await interceptor.intercept(
        context,
        next,
        options,
      );
      assertEquals(callStacks, [1]);

      assertEquals(context.response.body, "hello");

      await interceptor.intercept(
        context,
        next,
        options,
      );
      assertEquals(callStacks, [1]);
      assert(context.response.body instanceof Promise, "cache hit");
      assertEquals(await context.response.body, "hello");

      await delay(1000);
      await interceptor.intercept(
        context,
        next,
        options,
      );
      assertEquals(callStacks, [1, 1], "ttl works");
      assert(typeof context.response.body === "string");
      assertEquals(context.response.body, "hello");
    },
  );

  await t.step("isCacheableValue", async (it) => {
    const callStacks: number[] = [];
    const interceptor = new CacheInterceptor({
      ttl: 1,
      isCacheableValue: (val) => {
        return val !== "hello";
      },
    });
    await interceptor.onModuleInit();

    const context = createMockContext({
      method: "GET",
      path: "http://localhost",
    });
    const next = () => {
      callStacks.push(1);
      context.response.body = "hello";
    };

    class A {
      a() {}
    }
    const target = new A();
    const options = {
      target,
      args: [],
      methodName: "a",
      methodType: "get",
      fn: target.a,
      next,
    };

    await it.step("first", async () => {
      await interceptor.intercept(
        context,
        next,
        options,
      );
      assertEquals(callStacks, [1]);
      assertEquals(context.response.body, "hello");
      callStacks.length = 0;
    });

    await it.step("second", async () => {
      await interceptor.intercept(
        context,
        next,
        options,
      );
      assertEquals(callStacks, [1]);
      assertEquals(context.response.body, "hello");
    });
  });

  await t.step("isCacheableValue, with other store", async (it) => {
    const callStacks: number[] = [];
    const interceptor = new CacheInterceptor({
      ttl: 1,
      isCacheableValue: (val) => {
        return val !== true;
      },
      store: "LRU",
    });
    await interceptor.onModuleInit();

    const context = createMockContext({
      method: "GET",
      path: "http://localhost",
    });
    const next = () => {
      callStacks.push(1);
      context.response.body = true;
    };

    class A {
      a() {}
    }
    const target = new A();
    const options = {
      target,
      args: [],
      methodName: "a",
      methodType: "get",
      fn: target.a,
      next,
    };

    await it.step("first", async () => {
      await interceptor.intercept(
        context,
        next,
        options,
      );
      assertEquals(callStacks, [1]);
      assertEquals(context.response.body, true);
      callStacks.length = 0;
    });

    await it.step("second", async () => {
      await interceptor.intercept(
        context,
        next,
        options,
      );
      assertEquals(callStacks, [1]);
      assertEquals(context.response.body, true);
    });
  });

  await t.step("response reject promise", async (it) => {
    const callStacks: number[] = [];
    const interceptor = new CacheInterceptor({
      ttl: 1,
    });
    await interceptor.onModuleInit();

    const context = createMockContext({
      method: "GET",
      path: "http://localhost",
    });
    const next = () => {
      callStacks.push(1);
      return Promise.reject("err");
    };

    class A {
      a() {}
    }
    const target = new A();
    const options = {
      target,
      args: [],
      methodName: "a",
      methodType: "get",
      fn: target.a,
      next,
    };

    await it.step("first", async () => {
      await assertRejects(() =>
        interceptor.intercept(
          context,
          next,
          options,
        )
      );
      assertEquals(callStacks, [1]);
      assertEquals(context.response.body, undefined);
      callStacks.length = 0;
    });

    await it.step("second", async () => {
      await assertRejects(() =>
        interceptor.intercept(
          context,
          next,
          options,
        )
      );
      assertEquals(callStacks, [1]);
      assertEquals(context.response.body, undefined);
      callStacks.length = 0;
    });
  });

  await t.step("response reject promise, with other store", async (it) => {
    const callStacks: number[] = [];
    const interceptor = new CacheInterceptor({
      ttl: 1,
      store: "LRU",
    });
    await interceptor.onModuleInit();

    const context = createMockContext({
      method: "GET",
      path: "http://localhost",
    });
    const next = () => {
      callStacks.push(1);
      return Promise.reject("err");
    };

    class A {
      a() {}
    }
    const target = new A();
    const options = {
      target,
      args: [],
      methodName: "a",
      methodType: "get",
      fn: target.a,
      next,
    };

    await it.step("first", async () => {
      await assertRejects(() =>
        interceptor.intercept(
          context,
          next,
          options,
        )
      );
      assertEquals(callStacks, [1]);
      assertEquals(context.response.body, undefined);
      callStacks.length = 0;
    });

    await it.step("second", async () => {
      await assertRejects(() =>
        interceptor.intercept(
          context,
          next,
          options,
        )
      );
      assertEquals(callStacks, [1]);
      assertEquals(context.response.body, undefined);
      callStacks.length = 0;
    });
  });

  await t.step("intercept with CacheTTL", async () => {
    const callStack: number[] = [];

    @Controller("")
    @UseInterceptors(CacheInterceptor)
    class A {
      @Get("/")
      @CacheTTL(0.1)
      a() {
        callStack.push(1);
        return "hello";
      }
    }

    const moduleRef = await createTestingModule({
      imports: [CacheModule.register({
        ttl: 60,
        max: 2,
        maxSize: 100000, // will be ignored
        store: "memory",
      })],
      controllers: [A],
    }).compile();
    const app = moduleRef.createNestApplication();
    await app.init();

    { // first
      const res = await fetch(`http://localhost:${app.port}`);
      assertEquals(res.status, 200);
      assertEquals(await res.text(), "hello");
      assertEquals(callStack, [1]);
      callStack.length = 0;
    }

    // second
    await delay(1000);
    {
      const res = await fetch(`http://localhost:${app.port}`);
      assertEquals(res.status, 200);
      assertEquals(await res.text(), "hello");
      assertEquals(callStack, [1], "CacheTTL works");
    }

    callStack.length = 0;

    await app.close();
  });
});

Deno.test("intercept with GET method", {
  sanitizeOps: false,
  sanitizeResources: false,
}, async (t) => {
  const callStack: number[] = [];

  @Controller("")
  @UseInterceptors(CacheInterceptor)
  class A {
    @Get("/")
    a() {
      callStack.push(1);
      return "hello";
    }
  }

  const moduleRef = await createTestingModule({
    imports: [CacheModule.register()],
    controllers: [A],
  }).compile();
  const app = moduleRef.createNestApplication();
  await app.init();

  await t.step("first", async () => {
    const res = await fetch(`http://localhost:${app.port}`);
    assertEquals(res.status, 200);
    assertEquals(await res.text(), "hello");
    assertEquals(callStack, [1]);
    callStack.length = 0;
  });

  await t.step("second", async () => {
    const res = await fetch(`http://localhost:${app.port}`);
    assertEquals(res.status, 200);
    assertEquals(await res.text(), "hello");
    assertEquals(callStack, []);
  });

  callStack.length = 0;

  await app.close();
});

Deno.test("intercept with cache key", {
  sanitizeOps: false,
  sanitizeResources: false,
}, async (t) => {
  const callStack: number[] = [];

  @Controller("")
  @UseInterceptors(CacheInterceptor)
  class A {
    @Get("/")
    @CacheKey("test")
    a() {
      callStack.push(1);
      return "hello";
    }
  }

  const moduleRef = await createTestingModule({
    imports: [CacheModule.register()],
    controllers: [A],
  }).compile();
  const app = moduleRef.createNestApplication();
  await app.init();

  await t.step("first", async () => {
    const res = await fetch(`http://localhost:${app.port}`);
    assertEquals(res.status, 200);
    assertEquals(await res.text(), "hello");
    assertEquals(callStack, [1]);
    callStack.length = 0;
  });

  await t.step("second", async () => {
    const res = await fetch(`http://localhost:${app.port}`);
    assertEquals(res.status, 200);
    assertEquals(await res.text(), "hello");
    assertEquals(callStack, []);
  });

  callStack.length = 0;

  await app.close();
});
