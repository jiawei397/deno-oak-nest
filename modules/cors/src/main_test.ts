import {
  Request,
  Response,
} from "../../../src/interfaces/context.interface.ts";
import { Next } from "../../../src/interfaces/middleware.interface.ts";
import {
  assertEquals,
  beforeEach,
  describe,
  it,
} from "../../../tests/test_deps.ts";
import { createMockContext } from "../../../tests/common_helper.ts";
import { CORS, defaults } from "./main.ts";

describe("cors", () => {
  let mockNext: Next;
  const origin = "https://www.baidu.com";
  let mockRequest: Request, mockResponse: Response;
  beforeEach(() => {
    const context = createMockContext({
      method: "OPTIONS",
      path: "https://pan.baidu.com/options",
      reqHeaders: {
        origin,
      },
    });
    mockRequest = context.request;
    mockResponse = context.response;
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

  describe("origin is false", () => {
    it("*", async () => {
      await CORS(false)(mockRequest, mockResponse, mockNext);
      assertEquals(
        mockResponse.headers.get("Access-Control-Allow-Origin"),
        null,
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

  it("maxAge set to 1", async () => {
    await CORS({
      maxAge: 1,
    })(mockRequest, mockResponse, mockNext);
    assertEquals(
      mockResponse.headers.get("Access-Control-Max-Age"),
      "1",
    );
  });

  describe("exposedHeaders", () => {
    it("exposedHeaders is Array", async () => {
      await CORS({
        exposedHeaders: ["x-test", "x-test2"],
      })(mockRequest, mockResponse, mockNext);
      assertEquals(
        mockResponse.headers.get("Access-Control-Expose-Headers"),
        "x-test,x-test2",
      );
    });

    it("exposedHeaders is Array but empty", async () => {
      await CORS({
        exposedHeaders: [""],
      })(mockRequest, mockResponse, mockNext);
      assertEquals(
        mockResponse.headers.get("Access-Control-Expose-Headers"),
        null,
      );
    });

    it("exposedHeaders is not Array", async () => {
      await CORS({
        exposedHeaders: "x-test",
      })(mockRequest, mockResponse, mockNext);
      assertEquals(
        mockResponse.headers.get("Access-Control-Expose-Headers"),
        "x-test",
      );
    });
  });

  describe("allowedHeaders", () => {
    it("allowedHeaders is Array", async () => {
      await CORS({
        allowedHeaders: ["x-test", "x-test2"],
      })(mockRequest, mockResponse, mockNext);
      assertEquals(
        mockResponse.headers.get("Access-Control-Allow-Headers"),
        "x-test,x-test2",
      );
    });

    it("allowedHeaders is not Array", async () => {
      await CORS({
        allowedHeaders: "x-test",
      })(mockRequest, mockResponse, mockNext);
      assertEquals(
        mockResponse.headers.get("Access-Control-Allow-Headers"),
        "x-test",
      );
    });
  });

  describe("methods", () => {
    it("methods is Array", async () => {
      await CORS({
        methods: ["get", "post"],
      })(mockRequest, mockResponse, mockNext);
      assertEquals(
        mockResponse.headers.get("Access-Control-Allow-Methods"),
        "get,post",
      );
    });

    it("methods is not Array", async () => {
      await CORS({
        methods: "get",
      })(mockRequest, mockResponse, mockNext);
      assertEquals(
        mockResponse.headers.get("Access-Control-Allow-Methods"),
        "get",
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

describe("cors get", () => {
  let mockNext: Next;
  const origin = "https://www.baidu.com";
  let mockRequest: Request, mockResponse: Response;
  beforeEach(() => {
    const context = createMockContext({
      method: "GET",
      path: "https://pan.baidu.com/options",
      reqHeaders: {
        origin,
      },
    });
    mockRequest = context.request;
    mockResponse = context.response;
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
});
