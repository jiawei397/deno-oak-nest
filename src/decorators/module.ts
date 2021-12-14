// deno-lint-ignore-file no-explicit-any
import { Reflect } from "../../deps.ts";
import {
  ModuleMetadata,
  ModuleMetadataKey,
} from "../interfaces/module.interface.ts";

const MODULE_KEY = Symbol("module:isModule");

export function Module(metadata: ModuleMetadata) {
  return (target: any) => {
    Object.keys(metadata).forEach((key) => {
      Reflect.defineMetadata(key, (metadata as any)[key], target);
    });
    Reflect.defineMetadata(MODULE_KEY, true, target);
    return target;
  };
}

export function isModule(module: any) {
  if (!module || (typeof module !== "function" && typeof module !== "object")) {
    return false;
  }
  return "imports" in module || Reflect.getMetadata(MODULE_KEY, module);
}

export function getModuleMetadata(key: ModuleMetadataKey, module: any) {
  return Reflect.getMetadata(key, module);
}
