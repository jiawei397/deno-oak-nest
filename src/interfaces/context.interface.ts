// deno-lint-ignore-file no-explicit-any
export interface Request {
  get url(): string;
  get method(): string;
  headers(): Record<string, string>;
  header(name: string): string | undefined;
  cookies(): Record<string, string>;
  cookie(name: string): string | undefined;
  params(): Record<string, string>;
  param(name: string): string | undefined;
  queries(): Record<string, string>;
  query(name: string): string | undefined;
  json(): Promise<any>;
  formData(): Promise<FormData>;
}

export interface Response {
  body: string | object | number | boolean | null;
  headers: Headers;
  status: number;
  statusText: string;
}

export interface Context {
  request: Request;
  response: Response;

  render(): any;
}
