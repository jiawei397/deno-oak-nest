// deno-lint-ignore-file no-explicit-any require-await
import {
  type Context,
  type Request,
  type Response,
} from "../src/interfaces/context.interface.ts";
import {
  IRouter,
  MiddlewareHandler,
  NotFoundHandler,
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
    states: {},
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

type MethodType = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
export class MockRouter implements IRouter {
  map: Map<MethodType, Map<string, MiddlewareHandler>> = new Map();

  routes(): void {
    // empty
  }
  private handle(path: string, fn: MiddlewareHandler, method: MethodType) {
    let getMap = this.map.get(method);
    if (!getMap) {
      getMap = new Map<string, MiddlewareHandler>();
      this.map.set(method, getMap);
    }
    getMap.set(path, fn);
  }
  get(
    path: string,
    fn: MiddlewareHandler,
  ) {
    this.handle(path, fn, "GET");
  }
  post(
    path: string,
    fn: MiddlewareHandler,
  ) {
    this.handle(path, fn, "POST");
  }
  put(
    path: string,
    fn: MiddlewareHandler,
  ) {
    this.handle(path, fn, "PUT");
  }
  delete(
    path: string,
    fn: MiddlewareHandler,
  ) {
    this.handle(path, fn, "DELETE");
  }

  patch(
    path: string,
    fn: MiddlewareHandler,
  ) {
    this.handle(path, fn, "PATCH");
  }

  use(fn: MiddlewareHandler) {
    this.get("*", fn);
    this.post("*", fn);
    this.put("*", fn);
    this.delete("*", fn);
    this.patch("*", fn);
  }

  notFound(_fn: NotFoundHandler): void {
    // empty
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
