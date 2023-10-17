// deno-lint-ignore-file no-explicit-any
import { Status } from "../../deps.ts";

export interface Request {
  getOriginalRequest<T>(): T;
  get url(): string;
  get method(): string;
  states: Record<string, any>;
  headers(): Record<string, string>;
  header(name: string): string | undefined;
  cookies(): Promise<Record<string, string>>;
  cookie(name: string): Promise<string | undefined>;
  params(): Record<string, string>;
  param(name: string): string | undefined;
  /**
   * Get multiple query param values
   */
  queries(name: string): string[];
  /**
   * Get a specific query param value
   */
  query(name: string): string | undefined;
  json(): Promise<any>;
  text(): Promise<string>;
  formData(): Promise<FormData>;
  // form(): Promise<URLSearchParams>;
}

export interface Response {
  getOriginalResponse<T>(): T;
  body: string | object | number | boolean | null;
  headers: Headers;
  status: Status;
  readonly statusText: string;
}

export interface Context {
  request: Request;
  response: Response;

  render(): any;
}
