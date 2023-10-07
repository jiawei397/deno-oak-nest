// deno-lint-ignore-file no-explicit-any
import type { Request } from "../../deps.ts";
import type { NestResponse } from "../response.ts";

export type NextFunction = () => unknown | Promise<unknown>;

export type NestRequest = Request;

export type ErrorHandler = (
  err: Error,
  req: NestRequest,
  res: NestResponse,
) => any | Promise<any>;

export type NotFoundHandler = (
  req: NestRequest,
  res: NestResponse,
) => any | Promise<any>;

export type NestMiddleware = (
  req: NestRequest,
  res: NestResponse,
  next: NextFunction,
) => Promise<any> | any;
