// deno-lint-ignore-file no-explicit-any require-await
import {
  type Context,
  ICookies,
  type Request,
  type Response,
} from "../src/interfaces/context.interface.ts";
import {
  IRouter,
  MethodType,
  MiddlewareHandler,
  NotFoundHandler,
} from "../src/interfaces/route.interface.ts";
import { Application } from "../src/application.ts";
import { NotImplementedException } from "../src/exceptions.ts";
import { ListenOptions } from "../src/interfaces/application.interface.ts";

export async function findUnusedPort(port: number) {
  try {
    const conn = await Deno.connect({ port });
    conn.close();
    return findUnusedPort(port + 1);
  } catch {
    // console.debug(`find unused port: ${port}`);
    return port;
  }
}

export type MockOptions = {
  path: string;
  method: Uppercase<MethodType> | "OPTIONS";
  body?: {
    type: string;
    value: any;
    headers?: Record<string, string>;
  };
  reqHeaders?: Record<string, string>;
  cookies?: Record<string, string>;
  params?: Record<string, string>;
  queries?: Record<string, string | string[]>;
};

export const createMockContext = (options: MockOptions): Context => {
  const currentCookies = options.cookies || {};
  const mockCookies: ICookies = {
    async getAll(): Promise<Record<string, string>> {
      return currentCookies;
    },
    async get(name: string): Promise<string | false | undefined> {
      return currentCookies[name];
    },
    async has(name: string): Promise<boolean> {
      return currentCookies[name] !== undefined;
    },
    async set(name: string, value: string | null): Promise<ICookies> {
      if (value === null) {
        delete currentCookies[name];
        return this;
      }
      currentCookies[name] = value;
      return this;
    },
    delete(name: string): ICookies {
      delete currentCookies[name];
      return this;
    },
  };
  const mockRequest: Request = {
    cookies: mockCookies,
    startTime: Date.now(),
    method: options.method,
    url: options.path.startsWith("http")
      ? options.path
      : `http://localhost/${options.path.replace(/^\//, "")}`,
    states: {},
    header(key: string) {
      return options.reqHeaders?.[key];
    },
    headers() {
      return new Headers(options.reqHeaders);
    },
    params() {
      return { ...options.params };
    },
    param(name: string) {
      return options.params?.[name];
    },
    queries(name: string) {
      const value = options.queries?.[name];
      if (!value) {
        return [];
      }
      return Array.isArray(value) ? value : [value];
    },
    query(name: string) {
      const value = options.queries?.[name];
      if (!value) {
        return undefined;
      }
      return Array.isArray(value) ? value[0] : value;
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
    cookies: mockCookies,
    body: options.body?.value,
    headers: new Headers(options.body?.headers),
    status: 200,
    statusText: "",

    getOriginalContext: function <T>(): T {
      throw new Error("Function not implemented.");
    },
    render() {},
    redirect(url: string, status?: number) {
      if (status) {
        this.status = status;
      }
      this.headers.set("location", url);
    },
  };

  return {
    request: mockRequest,
    response: mockResponse,
    cookies: mockCookies,
  };
};

export type MethodHandler = (ctx: Context) => Promise<void>;

export class MockRouter implements IRouter {
  map: Map<Uppercase<MethodType>, Map<string, MethodHandler>> = new Map();

  routes(): void {
    // empty
  }
  private handle(
    path: string,
    fn: MiddlewareHandler,
    method: Uppercase<MethodType>,
  ) {
    let getMap = this.map.get(method);
    if (!getMap) {
      getMap = new Map<string, MethodHandler>();
      this.map.set(method, getMap);
    }
    getMap.set(path || "/", (ctx) => fn(ctx, () => Promise.resolve()));
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

  startServer(options: ListenOptions) {
    options.onListen?.({ hostname: "localhost", port: 3000, transport: "tcp" });
  }

  serveForStatic() {
    // empty
  }

  // deno-lint-ignore ban-types
  useOriginMiddleware(_fn: Function, _path?: string): void {
    throw new NotImplementedException("");
  }
}

export function createMockRouter() {
  return new MockRouter();
}

export function createMockApp() {
  const router = createMockRouter();
  const app = new Application(router);
  app.useLogger(false);

  return app;
}

export async function mockCallMethod(
  app: Application,
  ctx: Context,
) {
  await (app as any).routes();

  const url = ctx.request.url;
  const method = ctx.request.method as Uppercase<MethodType>;
  const router = (app as any).router as MockRouter;
  const pathname = new URL(url).pathname;
  // console.log(router.map);
  const func = router.map.get(method)?.get(pathname);
  if (!func) {
    throw new Error(`can not find ${method} ${url}`);
  }
  return func(ctx);
}
