import {
  Request,
  Response,
} from "../../../src/interfaces/context.interface.ts";
import { Next } from "../../../src/interfaces/middleware.interface.ts";
import { assertEquals, beforeEach, describe, it } from "../../../test_deps.ts";
import { CORS, defaults } from "./main.ts";

describe("cors", () => {
  let mockNext: Next;
  const origin = "https://www.baidu.com";
  let mockRequest: Request, mockResponse: Response;
  beforeEach(() => {
    mockRequest = {
      method: "OPTIONS",
      url: "https://pan.baidu.com/options",
      header(key: string) {
        if (key === "origin") {
          return origin;
        }
        return "else";
      },
      headers() {
        return {};
      },
      cookies() {
        return {};
      },
      cookie(name: string) {
        return "";
      },
      params() {
        return {};
      },
      param(name: string) {
        return "";
      },
      queries() {
        return {};
      },
      query(name: string) {
        return "";
      },
      // deno-lint-ignore require-await
      async json() {
        return {};
      },
      async formData() {
        return new FormData();
      },
    };
    mockResponse = {
      body: "",
      headers: new Headers(),
      status: 200,
      statusText: "",
    };
    mockNext = () => {
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          resolve();
        }, 0);
      });
    };
  });

  it("no params", async () => {
    await CORS()(mockRequest, mockResponse, mockNext);
    assertEquals(
      mockResponse.headers.get("Access-Control-Allow-Origin"),
      origin,
    );
  });

  it("params is true", async () => {
    await CORS(true)(mockRequest, mockResponse, mockNext);
    assertEquals(
      mockResponse.headers.get("Access-Control-Allow-Origin"),
      origin,
    );
  });

  it("origin is function", async () => {
    await CORS({
      origin: (_origin) => {
        return false;
      },
    })(mockRequest, mockResponse, mockNext);
    assertEquals(
      mockResponse.headers.get("Access-Control-Allow-Origin"),
      null,
    );

    const origin = "https://www.google.com";
    await CORS({
      origin: () => {
        return origin;
      },
    })(mockRequest, mockResponse, mockNext);
    assertEquals(
      mockResponse.headers.get("Access-Control-Allow-Origin"),
      origin,
    );
  });

  describe("origin is string", () => {
    it("*", async () => {
      const origin = "*";
      await CORS({
        origin,
      })(mockRequest, mockResponse, mockNext);
      assertEquals(
        mockResponse.headers.get("Access-Control-Allow-Origin"),
        origin,
      );
    });
    it("simple string", async () => {
      const origin = "https://www.google.com";
      await CORS({
        origin,
      })(mockRequest, mockResponse, mockNext);
      assertEquals(
        mockResponse.headers.get("Access-Control-Allow-Origin"),
        origin,
      );
    });
  });

  describe("origin is Array", () => {
    it("contain the origin", async () => {
      const origins = ["https://www.google.com", origin];
      await CORS({
        origin: origins,
      })(mockRequest, mockResponse, mockNext);
      assertEquals(
        mockResponse.headers.get("Access-Control-Allow-Origin"),
        origin,
      );
    });

    it("not contain the origin", async () => {
      const origins = ["https://www.google.com", "https://aa.com"];
      await CORS({
        origin: origins,
      })(mockRequest, mockResponse, mockNext);
      assertEquals(
        mockResponse.headers.get("Access-Control-Allow-Origin"),
        null,
      );
    });

    it("origin is a RegExp right array", async () => {
      const origins = [/google.com/, /baidu\.com/];
      await CORS({
        origin: origins,
      })(mockRequest, mockResponse, mockNext);
      assertEquals(
        mockResponse.headers.get("Access-Control-Allow-Origin"),
        origin,
      );
    });
    it("origin is a RegExp error array", async () => {
      const origins = [/google.com/, /aa\.com/];
      await CORS({
        origin: origins,
      })(mockRequest, mockResponse, mockNext);
      assertEquals(
        mockResponse.headers.get("Access-Control-Allow-Origin"),
        null,
      );
    });
  });

  describe("origin is RegExp", () => {
    it("right", async () => {
      const reg = /baidu\.com/;
      await CORS({
        origin: reg,
      })(mockRequest, mockResponse, mockNext);
      assertEquals(
        mockResponse.headers.get("Access-Control-Allow-Origin"),
        origin,
      );
    });

    it("error", async () => {
      const reg2 = /google\.com/;
      await CORS({
        origin: reg2,
      })(mockRequest, mockResponse, mockNext);
      assertEquals(
        mockResponse.headers.get("Access-Control-Allow-Origin"),
        null,
      );
    });
  });

  describe("OPTIONS status", () => {
    it("no params", async () => {
      await CORS()(mockRequest, mockResponse, mockNext);
      assertEquals(
        mockResponse.status,
        defaults.optionsSuccessStatus,
      );
    });

    it("has params optionsSuccessStatus", async () => {
      await CORS({
        optionsSuccessStatus: 200,
      })(mockRequest, mockResponse, mockNext);
      assertEquals(
        mockResponse.status,
        200,
      );
    });

    it("has params preflightContinue", async () => {
      await CORS({
        preflightContinue: true,
      })(mockRequest, mockResponse, mockNext);
      assertEquals(
        mockResponse.status,
        200,
      );
    });
  });
});
