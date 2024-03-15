// deno-lint-ignore-file no-explicit-any
import { Request, Response } from "./context.interface.ts";

export type Next = () => void | Promise<void>;

export type NestMiddleware = (
  req: Request,
  res: Response,
  next: Next,
) => Promise<any> | any;

export type INestMiddleware = {
  use: NestMiddleware;
};
