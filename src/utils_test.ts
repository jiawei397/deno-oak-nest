import { assert, assertEquals } from "../test_deps.ts";
import { parseSearch, parseSearchParams } from "./utils.ts";

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
    console.log(result);

    assertEquals(result, {
      key1: decodeURIComponent("%20%26%3D%2B"),
      key2: decodeURIComponent("%3F"),
    });
  });
});
