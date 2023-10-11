// deno-lint-ignore-file no-explicit-any no-unused-vars
import {
  type Context,
  type Request,
  type Response,
} from "../src/interfaces/context.interface.ts";
import {
  IRouter,
  MiddlewareHandler,
} from "../src/interfaces/route.interface.ts";
import { Application } from "../src/application.ts";

export const createMockContext = (options: {
  path: string;
  method: string;
  body?: {
    type: string;
    value: any;
  };
}): Context => {
  const mockRequest: Request = {
    method: options.method,
    url: options.path,
    header(key: string) {
      return "";
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
    // deno-lint-ignore require-await
    async formData() {
      return new FormData();
    },
  };
  const mockResponse: Response = {
    body: options.body?.value,
    headers: new Headers(),
    status: 200,
    statusText: "",
  };

  return {
    request: mockRequest,
    response: mockResponse,
    render() {},
  };
};

export class MockRouter implements IRouter {
  map: Map<"GET" | "POST" | "PUT" | "DELETE", Map<string, MiddlewareHandler>> =
    new Map();
  get(
    path: string,
    fn: MiddlewareHandler,
  ) {
    let getMap = this.map.get("GET");
    if (!getMap) {
      getMap = new Map<string, MiddlewareHandler>();
      this.map.set("GET", getMap);
    }
    getMap.set(path, fn);
  }
  post(
    path: string,
    fn: MiddlewareHandler,
  ) {
    let postMap = this.map.get("POST");
    if (!postMap) {
      postMap = new Map<string, MiddlewareHandler>();
      this.map.set("POST", postMap);
    }
    postMap.set(path, fn);
  }
  put(
    path: string,
    fn: MiddlewareHandler,
  ) {
    let putMap = this.map.get("PUT");
    if (!putMap) {
      putMap = new Map<string, MiddlewareHandler>();
      this.map.set("PUT", putMap);
    }
    putMap.set(path, fn);
  }
  delete(
    path: string,
    fn: MiddlewareHandler,
  ) {
    let deleteMap = this.map.get("DELETE");
    if (!deleteMap) {
      deleteMap = new Map<string, MiddlewareHandler>();
      this.map.set("DELETE", deleteMap);
    }
    deleteMap.set(path, fn);
  }

  use(fn: MiddlewareHandler) {
    this.get("*", fn);
    this.post("*", fn);
    this.put("*", fn);
    this.delete("*", fn);
  }

  startServer() {
    // empty
  }

  serveForStatic() {
    // empty
  }
}

export function createMockRouter() {
  return new MockRouter();
}

export function createMockNext() {
  return async () => {};
}

export function createMockApp() {
  const router = createMockRouter();
  const app = new Application(router);

  return app;
}

export function mockCallMethod(
  app: Application,
  ctx: Context,
) {
  (app as any).routes();

  const path = ctx.request.url;
  const method = ctx.request.method as "GET" | "POST" | "PUT" | "DELETE";
  const router = (app as any).router as MockRouter;
  return router.map.get(method)!.get(path)?.(ctx, createMockNext());
}
