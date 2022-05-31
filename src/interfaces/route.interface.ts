import { ControllerMethod } from "./guard.interface.ts";
import { Type } from "./type.interface.ts";

export interface RouteMap {
  methodPath: string;
  alias: string;
  methodType: string;
  fn: ControllerMethod;
  methodName: string;
  instance: InstanceType<Type>;
  cls: Type;
  isAbsolute?: boolean;
}

export type RouteItem = {
  controllerPath: string;
  arr: RouteMap[];
  cls: Type;
};
