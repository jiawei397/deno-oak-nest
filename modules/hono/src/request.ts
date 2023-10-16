// deno-lint-ignore-file require-await
import { Request } from "../../../src/interfaces/context.interface.ts";
import { getCookie, HonoContext, HonoRequest } from "../deps.ts";

export class NestRequest implements Request {
  originalRequest: HonoRequest;
  originalContext: HonoContext;
  // deno-lint-ignore no-explicit-any
  states: Record<string, any> = {};

  constructor(context: HonoContext) {
    this.originalContext = context;
    this.originalRequest = context.req;
  }

  getOriginalRequest<T>(): T {
    return this.originalRequest as T;
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

  text(): Promise<string> {
    return this.originalRequest.text();
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

  async cookies(): Promise<Record<string, string>> {
    return getCookie(this.originalContext);
  }

  /**
   * Get a specific cookie value
   */
  async cookie(name: string): Promise<string | undefined> {
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
  queries(name: string): string[] {
    return this.originalRequest.queries(name) || [];
  }

  /**
   * Get a specific query param value
   */
  query(name: string): string | undefined {
    return this.originalRequest.query(name);
  }
}
