// deno-lint-ignore-file no-explicit-any
import { Request } from "../../../src/interfaces/context.interface.ts";
import { OakContext, OakRequest } from "../deps.ts";

export class NestRequest implements Request {
  originalRequest: OakRequest;
  originalContext: OakContext;

  constructor(context: OakContext) {
    this.originalContext = context;
    this.originalRequest = context.request;
  }

  getOriginalRequest<T>(): T {
    return this.originalRequest as T;
  }

  get url() {
    return this.originalRequest.url.href;
  }

  get method(): string {
    return this.originalRequest.method;
  }

  async json(): Promise<any> {
    const body = this.originalRequest.body({ type: "json" });
    const json = await body.value;
    return json;
  }

  text(): Promise<string> {
    const body = this.originalRequest.body({ type: "text" });
    return body.value;
  }

  async formData(): Promise<FormData> {
    const contentType = this.originalRequest.headers.get("content-type");
    if (
      !contentType ||
      !["application/x-www-form-urlencoded", "multipart/form-data"].includes(
        contentType,
      )
    ) {
      throw new Error("Invalid content type");
    }
    if (contentType === "application/x-www-form-urlencoded") {
      const body = this.originalRequest.body({ type: "form" });
      const result = await body.value;
      const form = new FormData();
      Object.keys(result).forEach((key) => {
        form.set(key, result.get(key)!);
      });
      return form;
    }
    const body = this.originalRequest.body({ type: "form-data" }).value;
    const result = await body.read({});
    const formData = new FormData();
    Object.keys(result.fields).forEach((key) => {
      formData.set(key, result.fields[key]);
    });
    result.files &&
      result.files.forEach((file) => {
        formData.append(
          "files",
          new Blob([file.content!], { type: "application/octet-stream" }),
          file.name, // TODO: has other filenames
        );
      });
    return formData;
  }

  /**
   * Get all headers as a key-value object
   */
  headers(): Record<string, string> {
    const headersObject: Record<string, string> = {};
    for (const [name, value] of this.originalRequest.headers.entries()) {
      headersObject[name] = value;
    }
    return headersObject;
  }

  /**
   * Get a specific header value
   */
  header(name: string): string | undefined {
    return this.originalRequest.headers.get(name) || undefined;
  }

  async cookies(): Promise<Record<string, string>> {
    const cookies: Record<string, string> = {};
    for await (const [name, value] of this.originalContext.cookies.entries()) {
      cookies[name] = value;
    }
    return cookies;
  }

  /**
   * Get a specific cookie value
   */
  cookie(name: string): Promise<string | undefined> {
    return this.originalContext.cookies.get(name) || undefined;
  }

  /**
   * Get all path params as a key-value object
   */
  params(): Record<string, string> {
    return (this.originalContext as any).params;
  }

  /**
   * Get a specific param value. such as /user/:id
   */
  param(name: string): string | undefined {
    return (this.originalContext as any).params[name];
  }

  /**
   * Get multiple query param values
   */
  queries(name: string): string[] {
    const search = this.originalRequest.url.searchParams;
    return search.getAll(name);
  }

  /**
   * Get a specific query param value
   */
  query(name: string): string | undefined {
    return this.originalRequest.url.searchParams.get(name) || undefined;
  }
}
