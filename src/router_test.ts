// deno-lint-ignore-file no-explicit-any
import { assert, assertEquals } from "../test_deps.ts";
import { join, mapRoute, Router } from "./router.ts";
import { Controller, Get, Post } from "./decorators/controller.ts";

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
  assertEquals(map1.route, "/a");
  assertEquals(map1.methodName, "method1");
  assertEquals(map1.methodType, "get");
  assert(map1.instance instanceof A);
  assertEquals(map1.cls, A);

  const map2 = result[1];
  assert(map2);
  assertEquals(map2.route, "/b");
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
      !item.route.startsWith("/user/"),
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
  assertEquals(arr[0].route, "/a");
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

Deno.test("routes", async () => {
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

  Router.prototype.get = function (...args: any[]) {
    callStack.push(1);
    return (originGet as any).apply(this, args);
  };
  Router.prototype.post = function (...args: any[]) {
    callStack.push(2);
    return (originPost as any).apply(this, args);
  };

  router.routes();

  assertEquals(callStack, [1, 2]);

  // reset
  Router.prototype.get = originGet;
  Router.prototype.post = originPost;
});
