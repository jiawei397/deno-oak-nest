import { Context } from "../deps.ts";

export interface CanActivate {
  canActivate(context: Context): boolean | Promise<boolean>;
}

export type Constructor = new (...args: any[]) => any;

export interface RouteMap {
  route: string;
  method: string;
  fn: Function;
  methodName: string;
  instance: object;
  cls: Constructor;
}
