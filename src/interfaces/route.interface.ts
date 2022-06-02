import { AliasOptions } from "./controller.interface.ts";
import { ControllerMethod } from "./guard.interface.ts";
import { Type } from "./type.interface.ts";

export interface RouteMap {
  methodPath: string;
  methodType: string;
  fn: ControllerMethod;
  methodName: string;
  instance: InstanceType<Type>;
  cls: Type;
  aliasOptions?: AliasOptions;
}

export type RouteItem = {
  controllerPath: string;
  arr: RouteMap[];
  cls: Type;
  aliasOptions?: AliasOptions;
};
