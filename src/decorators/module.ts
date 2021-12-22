// deno-lint-ignore-file no-explicit-any
import { Reflect } from "../../deps.ts";
import {
  ModuleMetadata,
  ModuleMetadataKey,
} from "../interfaces/module.interface.ts";

export const MODULE_KEY = Symbol("module:isModule");

export function Module(metadata: ModuleMetadata): ClassDecorator {
  return (target: any) => {
    Object.keys(metadata).forEach((key) => {
      Reflect.defineMetadata(key, (metadata as any)[key], target);
    });
    defineModuleMetadata(target);
    return target;
  };
}

export function isModule(module: any) {
  if (!module || (typeof module !== "function" && typeof module !== "object")) {
    return false;
  }
  return "module" in module || Reflect.getOwnMetadata(MODULE_KEY, module);
}

// deno-lint-ignore ban-types
export function defineModuleMetadata(target: object) {
  Reflect.defineMetadata(MODULE_KEY, true, target);
}

export function getModuleMetadata(key: ModuleMetadataKey, module: any) {
  return Reflect.getOwnMetadata(key, module);
}
