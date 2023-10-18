// deno-lint-ignore-file no-explicit-any
import { BodyParamValidationException } from "../../../src/exceptions.ts";
import { Request } from "../../../src/interfaces/context.interface.ts";
import { OakContext, OakRequest } from "../deps.ts";

export class NestRequest implements Request {
  originalRequest: OakRequest;
  originalContext: OakContext;

  states: Record<string, any> = {};

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
      (!contentType.includes("multipart/form-data") &&
        !contentType.includes("application/x-www-form-urlencoded"))
    ) {
      throw new Error("Invalid content type");
    }
    if (contentType.includes("application/x-www-form-urlencoded")) {
      const body = this.originalRequest.body({ type: "form" });
      const result = await body.value;
      const form = new FormData();
      for (const [key, value] of result.entries()) {
        form.set(key, value);
      }
      return form;
    }
    const body = this.originalRequest.body({ type: "form-data" }).value;
    const result = await body.read({});
    const formData = new FormData();
    Object.keys(result.fields).forEach((key) => {
      formData.set(key, result.fields[key]);
    });
    //
    // content:  undefined
    // contentType: 'application/octet-stream'
    // filename: '/var/folders/sq/0jfgh1js6cs8_31df82hx3jw0000gn/T/db9658e7/9b58f3ae6093b7f1a5289a9eaf1727a6e143c693.bin'
    // name: 'c'
    // originalName: 'hello.txt'
    if (result.files) {
      await Promise.all(result.files.map(async (file) => {
        const content = file.content ||
          (file.filename ? await Deno.readFile(file.filename) : null);
        if (!content) {
          throw new BodyParamValidationException("file content is null");
        }
        formData.append(
          file.name,
          new Blob([content], { type: "application/octet-stream" }),
          file.originalName,
        );
      }));
    }

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
    return this.originalContext.cookies.get(name);
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
