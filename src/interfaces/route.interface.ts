import { ControllerMethod } from "./guard.interface.ts";
import { Type } from "./type.interface.ts";

export interface RouteMap {
  route: string;
  method: string;
  fn: ControllerMethod;
  methodName: string;
  instance: Record<string, unknown>;
  cls: Type;
}
