// deno-lint-ignore-file no-explicit-any
import { Request, Response } from "./context.interface.ts";

export type Next = () => unknown | Promise<unknown>;

export type NestMiddleware = (
  req: Request,
  res: Response,
  next: Next,
) => Promise<any> | any;
