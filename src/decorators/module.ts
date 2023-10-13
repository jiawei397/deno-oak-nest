// deno-lint-ignore-file no-explicit-any
import { Reflect } from "../../deps.ts";
import type {
  DynamicModule,
  ModuleMetadata,
  ModuleMetadataKey,
  ModuleType,
} from "../interfaces/module.interface.ts";

export const MODULE_KEY = Symbol("module:isModule");
export const onModuleInitedKey = Symbol("onModuleInited");

export function Module(metadata: ModuleMetadata): ClassDecorator {
  return (target: any) => {
    Object.keys(metadata).forEach((key) => {
      Reflect.defineMetadata(key, (metadata as any)[key], target);
    });
    defineModuleMetadata(target);
    return target;
  };
}

export function isModule(module: unknown): boolean {
  if (!module || (typeof module !== "function" && typeof module !== "object")) {
    return false;
  }
  return "module" in module || Reflect.hasOwnMetadata(MODULE_KEY, module);
}

export function isDynamicModule(module: ModuleType): module is DynamicModule {
  return "module" in module;
}

export function defineModuleMetadata(target: object) {
  Reflect.defineMetadata(MODULE_KEY, true, target);
}

export function getModuleMetadata(key: ModuleMetadataKey, module: any) {
  return Reflect.getOwnMetadata(key, module);
}

export function onModuleInit(instance: any) {
  if (typeof instance.onModuleInit === "function") {
    if (Reflect.hasOwnMetadata(onModuleInitedKey, instance)) {
      return;
    }
    Reflect.defineMetadata(onModuleInitedKey, true, instance);
    return instance.onModuleInit();
  }
}
