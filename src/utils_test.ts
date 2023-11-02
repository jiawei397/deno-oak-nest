import { assert, assertEquals } from "../tests/test_deps.ts";
import { createMockContext } from "../tests/common_helper.ts";
import {
  ControllerPathOptions,
  flagCronProvider,
  getControllerPaths,
  getCronInstance,
  getMethodPaths,
  getReadableStream,
  joinPath,
  MethodPathOptions,
  parseSearch,
  parseSearchParams,
  replaceAliasPath,
  setCacheControl,
  storeCronInstance,
} from "./utils.ts";

const test = Deno.test;

test("parseSearch", async (t) => {
  await t.step("empty", () => {
    const obj = parseSearch("");
    assert(obj);
    assertEquals(obj, {});
  });

  await t.step("with ?", () => {
    const obj = parseSearch("?");
    assert(obj);
    assertEquals(obj, {});
  });

  await t.step("with &", () => {
    const obj = parseSearch("?a=1&b=2");
    assert(obj);
    assertEquals(obj, { a: "1", b: "2" });
  });

  await t.step("starts with ? and double a", () => {
    const obj = parseSearch("?a=1&b=2&a=3");
    assert(obj);
    assertEquals(obj, { a: ["1", "3"], b: "2" });
  });

  await t.step("double a", () => {
    const obj = parseSearch("a=1&b=2&a=3");
    assert(obj);
    assertEquals(obj, { a: ["1", "3"], b: "2" });
  });

  await t.step("three a", () => {
    const obj = parseSearch("a=1&b=2&a=3&a=4");
    assert(obj);
    assertEquals(obj, { a: ["1", "3", "4"], b: "2" });
  });

  await t.step("should parse correctly", () => {
    const search = "key1=value1&key2=value2&key2=value3";

    const result = parseSearch(search);
    assertEquals(result, {
      key1: "value1",
      key2: ["value2", "value3"],
    });
  });
});

test("parseSearchParams", async (t) => {
  await t.step("should parse URLSearchParams correctly", () => {
    const searchParams = new URLSearchParams(
      "key1=value1&key2=value2&key2=value3",
    );
    const result = parseSearchParams(searchParams);
    assertEquals(result, {
      key1: "value1",
      key2: ["value2", "value3"],
    });
  });

  await t.step("three key1", () => {
    const searchParams = new URLSearchParams(
      "key1=value1&key2=value2&key2=value3&key2=value4",
    );
    const result = parseSearchParams(searchParams);
    assertEquals(result, {
      key1: "value1",
      key2: ["value2", "value3", "value4"],
    });
  });

  await t.step("should handle empty URLSearchParams", () => {
    const searchParams = new URLSearchParams("");
    const result = parseSearchParams(searchParams);
    assertEquals(result, {});
  });

  await t.step("should handle URLSearchParams with no values", () => {
    const searchParams = new URLSearchParams("key1=&key2");
    const result = parseSearchParams(searchParams);
    assertEquals(result, {
      key1: "",
      key2: "",
    });
  });

  await t.step("should handle URLSearchParams with special characters", () => {
    const searchParams = new URLSearchParams("key1=%20%26%3D%2B&key2=%3F");
    const result = parseSearchParams(searchParams);

    assertEquals(result, {
      key1: decodeURIComponent("%20%26%3D%2B"),
      key2: decodeURIComponent("%3F"),
    });
  });
});

test("setCacheControl", async (t) => {
  await t.step("should set cache-control", () => {
    const context = createMockContext({
      path: "/",
      method: "GET",
    });
    setCacheControl(context);
    assertEquals(context.response.headers.get("Cache-Control"), "no-cache");
  });

  await t.step("request cache-control", () => {
    const context = createMockContext({
      path: "/",
      method: "GET",
      reqHeaders: {
        "Cache-Control": "max-age=100",
      },
    });
    setCacheControl(context);
    assertEquals(context.response.headers.get("Cache-Control"), "max-age=100");
  });

  await t.step("request cache-control multi", () => {
    const context = createMockContext({
      path: "/",
      method: "GET",
      reqHeaders: {
        "Cache-Control": "max-age=100, no-cache",
      },
    });
    setCacheControl(context);
    assertEquals(
      context.response.headers.get("Cache-Control"),
      "max-age=100, no-cache",
    );
  });

  await t.step(
    "should not modify responseCacheControl if it is already set",
    () => {
      const context = createMockContext({
        path: "/",
        method: "GET",
      });
      context.response.headers.set(
        "Cache-Control",
        "max-age=3600, no-transform",
      );

      setCacheControl(context);

      assertEquals(
        context.response.headers.get("Cache-Control"),
        "max-age=3600, no-transform",
      );
    },
  );
});

Deno.test("getReadableStream should return a readable stream with the given message", async () => {
  const message = "Hello, world!";
  const { body, write, end } = getReadableStream();
  write(message);
  end("end");

  const reader = body.getReader();
  const result = await reader.read();
  const decoder = new TextDecoder();
  const text = decoder.decode(result.value);

  assertEquals(text, message);
});

Deno.test("joinPath", () => {
  assertEquals(joinPath(), "/");
  assertEquals(joinPath(""), "/");
  assertEquals(joinPath("/"), "/");
  assertEquals(joinPath("api"), "/api");
  assertEquals(joinPath("/api"), "/api");
  assertEquals(joinPath("/api/"), "/api");
  assertEquals(joinPath("api/"), "/api");

  assertEquals(joinPath("", "/api"), "/api");
  assertEquals(joinPath("", "/api/"), "/api");
  assertEquals(joinPath("", "api/"), "/api");

  assertEquals(joinPath("/api", "/"), "/api");
  assertEquals(joinPath("/api/", "/"), "/api");
  assertEquals(joinPath("/api", "/user"), "/api/user");
  assertEquals(joinPath("/api", "/user/"), "/api/user");
  assertEquals(joinPath("/api", "user/"), "/api/user");

  assertEquals(joinPath("/api", "user", "add"), "/api/user/add");
  assertEquals(joinPath("/api", "/user", "add"), "/api/user/add");
  assertEquals(joinPath("/api", "/user", "add/"), "/api/user/add");
  assertEquals(joinPath("/api", "/user/", "add/"), "/api/user/add");
  assertEquals(joinPath("/api", "/user/", "/add"), "/api/user/add");
  assertEquals(joinPath("/api", "/user/", "/add/"), "/api/user/add");
});

Deno.test("replaceAliasPath", async (t) => {
  await t.step("no replace", () => {
    const str = "/v1/user";
    assertEquals(
      replaceAliasPath(str, { prefix: "/api/", method: "info" }),
      str,
    );
  });

  await t.step("replace method", () => {
    const str = "${method}/v1/user";
    assertEquals(
      replaceAliasPath(str, { prefix: "/api/", method: "info" }),
      "/info/v1/user",
    );
  });

  await t.step("replace prefix", () => {
    const str = "${prefix}/v1/user";
    assertEquals(
      replaceAliasPath(str, { prefix: "/api/", method: "info" }),
      "/api/v1/user",
    );
  });

  await t.step("replace prefix and method", () => {
    const str = "${prefix}/v1/user/${method}";
    assertEquals(
      replaceAliasPath(str, { prefix: "/api/", method: "info" }),
      "/api/v1/user/info",
    );
  });
  await t.step("replace prefix and method2", () => {
    const str = "${prefix}/v1/user/${method}";
    assertEquals(
      replaceAliasPath(str, { prefix: "/api", method: "/info" }),
      "/api/v1/user/info",
    );
  });

  await t.step("replace prefix and method3", () => {
    const str = "${prefix}/v1/user/${method}";
    assertEquals(
      replaceAliasPath(str, { prefix: "/api/", method: "/info/" }),
      "/api/v1/user/info",
    );
  });

  await t.step("replace prefix method and controller", () => {
    const str = "${prefix}/v1/${controller}/${method}";
    assertEquals(
      replaceAliasPath(str, {
        prefix: "/api/",
        method: "info",
        controller: "user",
      }),
      "/api/v1/user/info",
    );
  });

  await t.step("replace method and controllerAlias", () => {
    const str = "${controllerAlias}/${method}";
    assertEquals(
      replaceAliasPath(str, {
        prefix: "/api/",
        method: "info",
        controller: "user",
        controllerAliasPath: "/v1/",
      }),
      "/v1/info",
    );
  });

  await t.step("replace prefix method and controllerAlias", () => {
    const str = "${prefix}/${controllerAlias}/${method}";
    assertEquals(
      replaceAliasPath(str, {
        prefix: "/api/",
        method: "info",
        controller: "user",
        controllerAliasPath: "/v1/",
      }),
      "/api/v1/info",
    );
  });

  await t.step("replace not ok", () => {
    const str = "${method2}/v1/user";
    assertEquals(
      replaceAliasPath(str, { prefix: "/api/", method: "info" }),
      "/" + str,
    );
  });
});

Deno.test("storeCronInstance and getCronInstance", async (t) => {
  await t.step("should return null if no instance is stored", () => {
    class CronService {}
    const instance = new CronService();
    storeCronInstance(CronService, instance);
    assertEquals(getCronInstance(CronService), undefined);
  });

  await t.step("should return instance if instance is stored", () => {
    class CronService {}
    flagCronProvider(CronService);

    const instance = new CronService();
    storeCronInstance(CronService, instance);
    assertEquals(getCronInstance(CronService), instance);
  });
});

Deno.test("getControllerPaths", async (t) => {
  await t.step("controllerPath and no alias", () => {
    const options: ControllerPathOptions = {
      prefix: "/api",
      controllerPath: "controllers/example",
    };
    const result = getControllerPaths(options);

    assertEquals(result.controllerPathWithPrefix, "/api/controllers/example");
    assertEquals(result.controllerAliasPath, undefined);
  });
  await t.step("controllerPath and alias", () => {
    const options: ControllerPathOptions = {
      prefix: "/api",
      controllerPath: "controllers/example",
      controllerAliasOptions: {
        alias: "alias/example",
      },
    };
    const result = getControllerPaths(options);

    assertEquals(result.controllerPathWithPrefix, "/api/controllers/example");
    assertEquals(result.controllerAliasPath, "/alias/example");
  });

  await t.step("controllerPath and alias, replace template", () => {
    const options: ControllerPathOptions = {
      prefix: "/api",
      controllerPath: "controllers/example",
      controllerAliasOptions: {
        alias: "alias/${prefix}/${controller}",
      },
    };
    const result = getControllerPaths(options);

    assertEquals(result.controllerPathWithPrefix, "/api/controllers/example");
    assertEquals(result.controllerAliasPath, "/alias/api/controllers/example");
  });

  await t.step("controllerPath and alias and aliasOnly", () => {
    const options: ControllerPathOptions = {
      prefix: "/api",
      controllerPath: "controllers/example",
      controllerAliasOptions: {
        alias: "alias/example",
        isAliasOnly: true,
      },
    };
    const result = getControllerPaths(options);

    assertEquals(result.controllerPathWithPrefix, undefined);
    assertEquals(result.controllerAliasPath, "/alias/example");
  });

  await t.step("controllerPath and aliasOnly, no alias", () => {
    const options: ControllerPathOptions = {
      prefix: "/api",
      controllerPath: "controllers/example",
      controllerAliasOptions: {
        isAliasOnly: true,
      },
    };
    const result = getControllerPaths(options);
    assertEquals(result.controllerPathWithPrefix, undefined);
    assertEquals(result.controllerAliasPath, "/controllers/example");
  });
});

Deno.test("getMethodPaths", async (t) => {
  await t.step("no prefix, and no alias", () => {
    const params: MethodPathOptions = {
      controllerPathWithPrefix: "/api/users",
      controllerPath: "/users",
      methodPath: ":id",
    };

    const { originPath, aliasPath } = getMethodPaths(params);

    assertEquals(originPath, "/api/users/:id");
    assertEquals(aliasPath, undefined);
  });

  await t.step("no prefix, and has controller alias, no method alias", () => {
    const params: MethodPathOptions = {
      controllerPathWithPrefix: "/api/users",
      controllerPath: "/users",
      controllerAliasPath: "/users-alias",
      methodPath: ":id",
    };

    const { originPath, aliasPath } = getMethodPaths(params);

    assertEquals(originPath, "/api/users/:id");
    assertEquals(aliasPath, "/users-alias/:id");
  });

  await t.step(
    "no prefix, and has controller alias, and has method alias",
    () => {
      const params: MethodPathOptions = {
        controllerPathWithPrefix: "/api/users",
        controllerPath: "/users",
        controllerAliasPath: "/users-alias",
        methodPath: ":id",
        methodAliasOptions: {
          alias: ":id-alias",
        },
      };

      const { originPath, aliasPath } = getMethodPaths(params);

      assertEquals(originPath, "/api/users/:id");
      assertEquals(aliasPath, "/:id-alias");
    },
  );

  await t.step(
    "no prefix, and has controller alias, and has method alias, and isAliasOnly",
    () => {
      const params: MethodPathOptions = {
        controllerPathWithPrefix: "/api/users",
        controllerPath: "/users",
        controllerAliasPath: "/users-alias",
        methodPath: ":id",
        methodAliasOptions: {
          alias: ":id-alias",
          isAliasOnly: true,
        },
      };

      const { originPath, aliasPath } = getMethodPaths(params);

      assertEquals(originPath, undefined);
      assertEquals(aliasPath, "/:id-alias");
    },
  );

  await t.step(
    "no prefix, and has controller alias, and has method alias, and isAliasOnly, and template replace controller",
    () => {
      const params: MethodPathOptions = {
        controllerPathWithPrefix: "/api/users",
        controllerPath: "/users",
        controllerAliasPath: "/users-alias",
        methodPath: ":id",
        methodAliasOptions: {
          alias: "${controller}/:id-alias",
          isAliasOnly: true,
        },
      };

      const { originPath, aliasPath } = getMethodPaths(params);

      assertEquals(originPath, undefined);
      assertEquals(aliasPath, "/users/:id-alias");
    },
  );

  await t.step(
    "no prefix, and has controller alias, and has method alias, and isAliasOnly, and template replace controllerAlias",
    () => {
      const params: MethodPathOptions = {
        controllerPathWithPrefix: "/api/users",
        controllerPath: "/users",
        controllerAliasPath: "/users-alias",
        methodPath: ":id",
        methodAliasOptions: {
          alias: "${controllerAlias}/:id-alias",
          isAliasOnly: true,
        },
      };

      const { originPath, aliasPath } = getMethodPaths(params);

      assertEquals(originPath, undefined);
      assertEquals(aliasPath, "/users-alias/:id-alias");
    },
  );

  await t.step(
    "no prefix, and has controller alias, and has method alias, and template replace controllerAlias",
    () => {
      const params: MethodPathOptions = {
        controllerPathWithPrefix: "/api/users",
        controllerPath: "/users",
        controllerAliasPath: "/users-alias",
        methodPath: ":id",
        methodAliasOptions: {
          alias: "${controllerAlias}/:id-alias",
        },
      };

      const { originPath, aliasPath } = getMethodPaths(params);

      assertEquals(originPath, "/api/users/:id");
      assertEquals(aliasPath, "/users-alias/:id-alias");
    },
  );

  await t.step(
    "has prefix, and has controller alias, but no method alias",
    () => {
      const params: MethodPathOptions = {
        apiPrefix: "/api",
        controllerPathWithPrefix: "/api/users",
        controllerPath: "/users",
        controllerAliasPath: "/users-alias",
        methodPath: "/:id",
      };
      const { originPath, aliasPath } = getMethodPaths(params);

      assertEquals(originPath, "/api/users/:id");
      assertEquals(aliasPath, "/users-alias/:id");
    },
  );

  await t.step("has prefix, and has both alias", () => {
    const params: MethodPathOptions = {
      controllerPathWithPrefix: "/api/users",
      controllerPath: "/users",
      controllerAliasPath: "/users-alias",
      methodPath: "/:id",
      methodAliasOptions: {
        alias: "/:id-alias",
      },
    };

    const { originPath, aliasPath } = getMethodPaths(params);

    assertEquals(originPath, "/api/users/:id");
    assertEquals(aliasPath, "/:id-alias");
  });

  await t.step("has prefix, and alias, isAliasOnly", () => {
    const params: MethodPathOptions = {
      controllerPathWithPrefix: "/api/users",
      controllerPath: "/users",
      controllerAliasPath: "/users-alias",
      methodPath: "/:id",
      methodAliasOptions: {
        alias: "/:id-alias",
        isAliasOnly: true,
      },
    };

    const { originPath, aliasPath } = getMethodPaths(params);

    assertEquals(originPath, undefined);
    assertEquals(aliasPath, "/:id-alias");
  });
});
