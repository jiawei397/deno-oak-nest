// deno-lint-ignore-file no-explicit-any
import {
  assert,
  assertEquals,
  assertStrictEquals,
  beforeEach,
  describe,
  it,
} from "../test_deps.ts";
import { checkEtag, parseSearch } from "./utils.ts";

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

describe("checkEtag", () => {
  let context: any;
  beforeEach(() => {
    context = {
      request: {
        headers: new Headers(),
      },
      response: {
        headers: new Headers(),
        body: null,
        status: 200,
      },
    };
  });
  it("match If-None-Match and will return 304", async () => {
    const val = "test value";
    context.request.headers.set(
      "If-None-Match",
      `W/"a-1Wx1Pg+M6Euj06soRijPZZT9qnQ"`,
    );
    const matched = await checkEtag(context, val);
    assert(matched);
    assert(context.response.headers.get("etag"));
    assertStrictEquals(context.response.status, 304);
    assertStrictEquals(context.response.body, undefined);
  });

  it("not match If-None-Match and will return 200", async () => {
    const val = "test value";
    context.request.headers.set(
      "If-None-Match",
      `abcd`,
    );
    const matched = await checkEtag(context, val);
    assert(!matched);
    assert(context.response.headers.get("etag"));
    assertStrictEquals(context.response.status, 200);
    assertStrictEquals(context.response.body, val);
  });

  it("should return input value if val is not provided", async () => {
    const val = null;

    const matched = await checkEtag(context, val);
    assert(!matched);

    assertStrictEquals(context.response.body, val);
  });
});
