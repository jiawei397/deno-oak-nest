// deno-lint-ignore-file no-explicit-any
import {
  assert,
  assertEquals,
  assertStrictEquals,
  beforeEach,
  describe,
  it,
} from "../test_deps.ts";
import { parseSearch } from "./utils.ts";

const test = Deno.test;

test("parseSearch", () => {
  {
    const obj = parseSearch("");
    assert(obj);
    assertEquals(obj, {});
  }

  {
    const obj = parseSearch("?");
    assert(obj);
    assertEquals(obj, {});
  }
  {
    const obj = parseSearch("?a=1&b=2");
    assert(obj);
    assertEquals(obj, { a: "1", b: "2" });
  }

  {
    const obj = parseSearch("?a=1&b=2&a=3");
    assert(obj);
    assertEquals(obj, { a: ["1", "3"], b: "2" });
  }

  {
    const obj = parseSearch("a=1&b=2&a=3");
    assert(obj);
    assertEquals(obj, { a: ["1", "3"], b: "2" });
  }

  {
    const obj = parseSearch("?a=1&b=2&a=3&a=4");
    assert(obj);
    assertEquals(obj, { a: ["1", "3", "4"], b: "2" });
  }
});
