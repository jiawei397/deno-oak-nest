// deno-lint-ignore-file no-explicit-any require-await
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
    headers?: Record<string, string>;
  };
  reqHeaders?: Record<string, string>;
  cookies?: Record<string, string>;
  params?: Record<string, string>;
  queries?: Record<string, string | string[]>;
}): Context => {
  const mockRequest: Request = {
    method: options.method,
    url: options.path.startsWith("http")
      ? options.path
      : `http://localhost/${options.path.replace(/^\//, "")}`,
    header(key: string) {
      return options.reqHeaders?.[key];
    },
    headers() {
      return { ...options.reqHeaders };
    },
    async cookies() {
      return { ...options.cookies };
    },
    async cookie(name: string) {
      return options.cookies?.[name];
    },
    params() {
      return { ...options.params };
    },
    param(name: string) {
      return options.params?.[name];
    },
    queries(name: string) {
      return options.queries?.[name] as string[];
    },
    query(name: string) {
      return options.queries?.[name] as string;
    },
    async json() {
      return options.body?.value;
    },
    async formData() {
      return options.body?.value;
    },
    text: function (): Promise<string> {
      return options.body?.value;
    },
    getOriginalRequest: function <T>(): T {
      throw new Error("Function not implemented.");
    },
  };
  const mockResponse: Response = {
    body: options.body?.value,
    headers: new Headers(options.body?.headers),
    status: 200,
    statusText: "",

    getOriginalResponse: function <T>(): T {
      throw new Error("Function not implemented.");
    },
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

  routes(): void {
    // empty
  }
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

export async function mockCallMethod(
  app: Application,
  ctx: Context,
) {
  await (app as any).routes();

  const url = ctx.request.url;
  const method = ctx.request.method as "GET" | "POST" | "PUT" | "DELETE";
  const router = (app as any).router as MockRouter;
  const pathname = new URL(url).pathname;
  const func = router.map.get(method)!.get(pathname);
  if (!func) {
    throw new Error(`can not find ${method} ${url}`);
  }
  return func(ctx, createMockNext());
}
