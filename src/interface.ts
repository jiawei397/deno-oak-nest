import { Context } from "../deps.ts";

export interface CanActivate {
  canActivate(context: Context): boolean | Promise<boolean>;
}

export type Constructor = new (...args: any[]) => any;

export type ControllerMethod = (...args: any[]) => any;

export interface RouteMap {
  route: string;
  method: string;
  fn: ControllerMethod;
  methodName: string;
  instance: object;
  cls: Constructor;
}
