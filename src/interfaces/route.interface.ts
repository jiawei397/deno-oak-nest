import { ControllerMethod } from "./guard.interface.ts";
import { Type } from "./type.interface.ts";

export interface RouteMap {
  route: string;
  methodType: string;
  fn: ControllerMethod;
  methodName: string;
  instance: InstanceType<Type>;
  cls: Type;
}

export type RouteItem = {
  controllerPath: string;
  arr: RouteMap[];
  cls: Type;
};
