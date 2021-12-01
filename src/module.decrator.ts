// deno-lint-ignore-file no-explicit-any
import { Reflect } from "../deps.ts";
import { ModuleMetadata } from "./interface.ts";

export function Module(metadata: ModuleMetadata) {
  return (target: any) => {
    Reflect.defineMetadata("controllers", metadata.controllers, target);
    Reflect.defineMetadata("imports", metadata.imports, target);
    Reflect.defineMetadata("isModule", true, target);
    return target;
  };
}
