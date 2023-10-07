export class NestResponse {
  body: string | object | number | boolean | null;
  headers: Headers = new Headers();
  status?: number;
  statusText?: string;
}
