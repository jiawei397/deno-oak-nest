import { Request } from "../../../src/interfaces/context.interface.ts";
import { getCookie, HonoContext, HonoRequest } from "../deps.ts";

export class NestRequest implements Request {
  originalRequest: HonoRequest;
  originalContext: HonoContext;

  constructor(context: HonoContext) {
    this.originalContext = context;
    this.originalRequest = context.req;
  }

  get url() {
    return this.originalRequest.url;
  }

  get method(): string {
    return this.originalRequest.method;
  }

  // deno-lint-ignore no-explicit-any
  json(): Promise<any> {
    return this.originalRequest.json();
  }

  formData(): Promise<FormData> {
    return this.originalRequest.formData();
  }

  /**
   * Get all headers as a key-value object
   */
  headers(): Record<string, string> {
    return this.originalRequest.header();
  }

  /**
   * Get a specific header value
   */
  header(name: string): string | undefined {
    return this.originalRequest.header(name);
  }

  cookies(): Record<string, string> {
    return getCookie(this.originalContext);
  }

  /**
   * Get a specific cookie value
   */
  cookie(name: string): string | undefined {
    return getCookie(this.originalContext, name);
  }

  /**
   * Get all path params as a key-value object
   */
  params(): Record<string, string> {
    return this.originalRequest.param() as Record<string, string>;
  }

  /**
   * Get a specific param value. such as /user/:id
   */
  param(name: string): string | undefined {
    // deno-lint-ignore no-explicit-any
    return (this.originalRequest as any).param(name);
  }

  /**
   * Get all query params as a key-value object
   */
  queries(): Record<string, string> {
    return this.originalRequest.query();
  }

  /**
   * Get a specific query param value
   */
  query(name: string): string | undefined {
    return this.originalRequest.query(name);
  }
}
