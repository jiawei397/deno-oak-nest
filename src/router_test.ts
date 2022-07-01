// deno-lint-ignore-file no-explicit-any
import {
  assert,
  assertEquals,
  Context,
  Status,
  testing,
} from "../test_deps.ts";
import {
  join,
  mapRoute,
  replacePrefix,
  replacePrefixAndSuffix,
  replaceSuffix,
  Router,
} from "./router.ts";
import { Controller, Get, Post } from "./decorators/controller.ts";
import type { CanActivate } from "./interfaces/guard.interface.ts";
import { UseGuards } from "./guard.ts";
import { Injectable } from "./decorators/inject.ts";

Deno.test("join", () => {
  assertEquals(join(""), "");
  assertEquals(join("/"), "");
  assertEquals(join("api"), "/api");
  assertEquals(join("/api"), "/api");
  assertEquals(join("/api/"), "/api");
  assertEquals(join("api/"), "/api");

  assertEquals(join("", "/api"), "/api");
  assertEquals(join("", "/api/"), "/api");
  assertEquals(join("", "api/"), "/api");

  assertEquals(join("/api", "/"), "/api");
  assertEquals(join("/api/", "/"), "/api");
  assertEquals(join("/api", "/user"), "/api/user");
  assertEquals(join("/api", "/user/"), "/api/user");
  assertEquals(join("/api", "user/"), "/api/user");

  assertEquals(join("/api", "user", "add"), "/api/user/add");
  assertEquals(join("/api", "/user", "add"), "/api/user/add");
  assertEquals(join("/api", "/user", "add/"), "/api/user/add");
  assertEquals(join("/api", "/user/", "add/"), "/api/user/add");
  assertEquals(join("/api", "/user/", "/add"), "/api/user/add");
  assertEquals(join("/api", "/user/", "/add/"), "/api/user/add");
});

Deno.test("replacePrefix", async (t) => {
  await t.step("no replace", () => {
    const str = "/v1/user";
    assertEquals(replacePrefix(str, "/api/"), str);
  });

  await t.step("replace empty prefix", () => {
    const str = "${prefix}/v1/user";
    assertEquals(replacePrefix(str, ""), "/v1/user");
  });

  await t.step("replace  prefix /", () => {
    const str = "${prefix}/v1/user";
    assertEquals(replacePrefix(str, "/"), "/v1/user");
  });

  await t.step("replace prefix", () => {
    const str = "${prefix}/v1/user";
    assertEquals(replacePrefix(str, "/api/"), "/api/v1/user");
  });

  await t.step("replace prefix2", () => {
    const str = "${prefix}/v1/user";
    assertEquals(replacePrefix(str, "api/"), "/api/v1/user");
  });

  await t.step("replace prefix3", () => {
    const str = "${prefix}/v1/user";
    assertEquals(replacePrefix(str, "api"), "/api/v1/user");
  });

  await t.step("replace prefix not ok", () => {
    const str = "${prefix2}/v1/user";
    assertEquals(replacePrefix(str, "api/"), "/" + str);
  });
});

Deno.test("replaceSuffix", async (t) => {
  await t.step("no replace", () => {
    const str = "/v1/user";
    assertEquals(replaceSuffix(str, "/api/"), str);
  });

  await t.step("replace suffix", () => {
    const str = "${suffix}/v1/user";
    assertEquals(replaceSuffix(str, "/api/"), "/api/v1/user");
  });

  await t.step("replace suffix2", () => {
    const str = "${suffix}/v1/user";
    assertEquals(replaceSuffix(str, "api/"), "/api/v1/user");
  });

  await t.step("replace suffix3", () => {
    const str = "${suffix}/v1/user";
    assertEquals(replaceSuffix(str, "api"), "/api/v1/user");
  });

  await t.step("replace suffix4", () => {
    const str = "/v1/user/${suffix}";
    assertEquals(replaceSuffix(str, "api"), "/v1/user/api");
  });

  await t.step("replace suffix5", () => {
    const str = "/v1/${suffix}/user";
    assertEquals(replaceSuffix(str, "api"), "/v1/api/user");
  });

  await t.step("replace suffix not ok", () => {
    const str = "${suffix2}/v1/user";
    assertEquals(replaceSuffix(str, "api/"), "/" + str);
  });
});

Deno.test("replacePrefixAndSuffix", async (t) => {
  await t.step("no replace", () => {
    const str = "/v1/user";
    assertEquals(replacePrefixAndSuffix(str, "/api/", "info"), str);
  });

  await t.step("replace suffix", () => {
    const str = "${suffix}/v1/user";
    assertEquals(replacePrefixAndSuffix(str, "/api/", "info"), "/info/v1/user");
  });

  await t.step("replace prefix", () => {
    const str = "${prefix}/v1/user";
    assertEquals(replacePrefixAndSuffix(str, "api/", "info"), "/api/v1/user");
  });

  await t.step("replace prefix and suffix", () => {
    const str = "${prefix}/v1/user/${suffix}";
    assertEquals(
      replacePrefixAndSuffix(str, "api", "info"),
      "/api/v1/user/info",
    );
  });
  await t.step("replace prefix and suffix2", () => {
    const str = "${prefix}/v1/user/${suffix}";
    assertEquals(
      replacePrefixAndSuffix(str, "/api", "/info"),
      "/api/v1/user/info",
    );
  });

  await t.step("replace prefix and suffix3", () => {
    const str = "${prefix}/v1/user/${suffix}";
    assertEquals(
      replacePrefixAndSuffix(str, "/api/", "/info/"),
      "/api/v1/user/info",
    );
  });

  await t.step("replace prefix suffix and controller", () => {
    const str = "${prefix}/v1/${controller}/${suffix}";
    assertEquals(
      replacePrefixAndSuffix(str, "/api/", "/info/", "user"),
      "/api/v1/user/info",
    );
  });

  await t.step("replace not ok", () => {
    const str = "${suffix2}/v1/user";
    assertEquals(replacePrefixAndSuffix(str, "/api/", "/info/"), "/" + str);
  });
});

Deno.test("mapRoute without controller route", async () => {
  class A {
    @Get("/a")
    method1() {}

    @Post("/b")
    method2() {}
  }

  const result = await mapRoute(A);
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
});

Deno.test("mapRoute with controller route", async () => {
  @Controller("/user")
  class A {
    @Get("/a")
    method1() {}

    @Post("/b")
    method2() {}
  }

  const result = await mapRoute(A);
  assert(Array.isArray(result));
  assertEquals(result.length, 2);

  result.forEach((item) => {
    assert(item);
    assert(
      !item.methodPath.startsWith("/user/"),
      'should not start with "/user/", this function not deal with controller route',
    );
  });
});

Deno.test("add", async () => {
  const router = new Router();
  class A {
    @Get("/a")
    method1() {}
  }
  const result = await router.add(A);
  assert(Array.isArray(result));
  assertEquals(result.length, 1);
  assert(result[0]);
  assertEquals(result[0].controllerPath, "");

  const arr = result[0].arr;
  assert(Array.isArray(arr));
  assertEquals(arr.length, 1);
  assertEquals(arr[0].methodPath, "/a");
  assertEquals(arr[0].methodName, "method1");

  const result2 = await router.add(A);
  assertEquals(result2.length, 1, "should not add same controller");

  class B {
    @Get("/b")
    method2() {}

    @Get("/c")
    method3() {}
  }

  const result3 = await router.add(B);
  assertEquals(result3.length, 2, "should add new controller");
  assertEquals(result3[1].arr.length, 2);
});

Deno.test("add with prefix", async () => {
  const router = new Router();
  router.setGlobalPrefix("api");
  class A {
    @Get("/a")
    method1() {}
  }
  const result = await router.add(A);
  assert(Array.isArray(result));
  assertEquals(result[0].controllerPath, "", "will not deal prefix now");
});

Deno.test("routes without controller", async () => {
  const router = new Router();
  router.setGlobalPrefix("api");

  class A {
    @Get("/a")
    method1() {}

    @Post("/b")
    method2() {}
  }
  await router.add(A);

  const callStack: number[] = [];
  const originGet = Router.prototype.get;
  const originPost = Router.prototype.post;

  const getCtx = testing.createMockContext({
    path: "/api/a",
    method: "GET",
  });

  const postCtx = testing.createMockContext({
    path: "/api/b",
    method: "POST",
  });

  Router.prototype.get = function (
    url: string,
    callback: (ctx: Context) => void,
  ) {
    callStack.push(1);
    return (originGet as any).call(this, url, () => {
      callStack.push(3);
      return callback.call(this, getCtx);
    });
  };
  Router.prototype.post = function (
    url: string,
    callback: (ctx: Context) => void,
  ) {
    callStack.push(2);
    return (originPost as any).call(this, url, () => {
      callStack.push(4);
      return callback.call(this, postCtx);
    });
  };

  const mw = router.routes();
  assertEquals(callStack, [1, 2]);
  const next = testing.createMockNext();

  await mw(getCtx, next);

  assertEquals(callStack, [1, 2, 3]);

  await mw(postCtx, next);
  assertEquals(callStack, [1, 2, 3, 4]);

  // reset
  Router.prototype.get = originGet;
  Router.prototype.post = originPost;
});

Deno.test("routes with controller", async () => {
  const router = new Router();
  router.setGlobalPrefix("api");

  @Controller("user")
  class A {
    @Get("/a")
    method1() {}

    @Post("/b")
    method2() {}
  }
  await router.add(A);

  const callStack: number[] = [];
  const originGet = Router.prototype.get;
  const originPost = Router.prototype.post;

  const getCtx = testing.createMockContext({
    path: "/api/user/a",
    method: "GET",
  });

  const postCtx = testing.createMockContext({
    path: "/api/user/b",
    method: "POST",
  });

  Router.prototype.get = function (
    url: string,
    callback: (ctx: Context) => void,
  ) {
    callStack.push(1);
    return (originGet as any).call(this, url, () => {
      callStack.push(3);
      return callback.call(this, getCtx);
    });
  };
  Router.prototype.post = function (
    url: string,
    callback: (ctx: Context) => void,
  ) {
    callStack.push(2);
    return (originPost as any).call(this, url, () => {
      callStack.push(4);
      return callback.call(this, postCtx);
    });
  };

  const mw = router.routes();
  assertEquals(callStack, [1, 2]);
  const next = testing.createMockNext();

  await mw(getCtx, next);

  assertEquals(callStack, [1, 2, 3]);

  await mw(postCtx, next);
  assertEquals(callStack, [1, 2, 3, 4]);

  // reset
  Router.prototype.get = originGet;
  Router.prototype.post = originPost;
});

Deno.test("routes check result", async (t) => {
  const router = new Router();
  @Controller("user")
  class A {
    @Get("/a")
    method1() {
      return "a";
    }

    @Get("/b")
    noReturn() {}

    @Get("/c")
    dealBodySelf(ctx: Context) {
      ctx.response.body = "c";
    }

    @Get("/d")
    error(ctx: Context) {
      ctx.response.status = 400;
      ctx.response.body = new Error("d");
    }
  }
  await router.add(A);

  await t.step("get a ", async () => {
    const ctx = testing.createMockContext({
      path: "/user/a",
      method: "GET",
    });
    const mw = router.routes();
    const next = testing.createMockNext();

    await mw(ctx, next);
    assertEquals(ctx.response.body, "a");
  });

  await t.step("get b", async () => {
    const ctx = testing.createMockContext({
      path: "/user/b",
      method: "GET",
    });
    const mw = router.routes();
    const next = testing.createMockNext();
    await mw(ctx, next);
    assertEquals(ctx.response.body, undefined);
  });

  await t.step("get c", async () => {
    const ctx = testing.createMockContext({
      path: "/user/c",
      method: "GET",
    });
    const mw = router.routes();
    const next = testing.createMockNext();
    await mw(ctx, next);
    assertEquals(ctx.response.body, "c");
  });

  await t.step("get d", async () => {
    const ctx = testing.createMockContext({
      path: "/user/d",
      method: "GET",
    });
    const mw = router.routes();
    const next = testing.createMockNext();
    await mw(ctx, next);
    assert(ctx.response.body instanceof Error);
    assertEquals(ctx.response.status, 400);
  });
});

Deno.test("routes with guard success", async () => {
  const router = new Router();

  class AuthGuard implements CanActivate {
    // deno-lint-ignore require-await
    async canActivate(_context: Context): Promise<boolean> {
      return true;
    }
  }

  const callStack: number[] = [];

  @UseGuards(AuthGuard)
  @Controller("user")
  class A {
    @Get("/a")
    method1() {
      callStack.push(1);
      return "a";
    }
  }
  await router.add(A);

  const ctx = testing.createMockContext({
    path: "/user/a",
    method: "GET",
  });
  const mw = router.routes();
  const next = testing.createMockNext();

  await mw(ctx, next);
  assertEquals(ctx.response.body, "a");
  assertEquals(callStack, [1]);
});

Deno.test("routes with guard forbidden", async () => {
  const router = new Router();

  @Injectable()
  class AuthGuard implements CanActivate {
    // deno-lint-ignore require-await
    async canActivate(_context: Context): Promise<boolean> {
      return false;
    }
  }

  const callStack: number[] = [];

  @UseGuards(AuthGuard)
  @Controller("user")
  class A {
    @Get("/a")
    method1() {
      callStack.push(1);
      return "a";
    }
  }
  await router.add(A);

  const ctx = testing.createMockContext({
    path: "/user/a",
    method: "GET",
  });
  const mw = router.routes();
  const next = testing.createMockNext();

  await mw(ctx, next);
  assertEquals(ctx.response.status, Status.Forbidden);
  assertEquals(callStack, []);
});

Deno.test("routes with guard status self", async () => {
  const router = new Router();
  const url = `https://www.baidu.com`;

  class AuthGuard implements CanActivate {
    // deno-lint-ignore require-await
    async canActivate(context: Context): Promise<boolean> {
      context.response.redirect(url);
      return false;
    }
  }

  const callStack: number[] = [];

  @UseGuards(AuthGuard)
  @Controller("user")
  class A {
    @Get("/a")
    method1() {
      callStack.push(1);
      return "a";
    }
  }
  await router.add(A);

  const ctx = testing.createMockContext({
    path: "/user/a",
    method: "GET",
  });
  const mw = router.routes();
  const next = testing.createMockNext();

  await mw(ctx, next);
  assertEquals(ctx.response.headers.get("Location"), url);
  assertEquals(ctx.response.status, 302);
  assertEquals(callStack, []);
});
