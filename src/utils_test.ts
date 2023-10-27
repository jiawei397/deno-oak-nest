import { assert, assertEquals } from "../test_deps.ts";
import { createMockContext } from "../tests/common_helper.ts";
import {
  getReadableStream,
  join,
  parseSearch,
  parseSearchParams,
  replacePrefix,
  replacePrefixAndSuffix,
  replaceSuffix,
  setCacheControl,
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

Deno.test("join", () => {
  assertEquals(join(), "");
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
