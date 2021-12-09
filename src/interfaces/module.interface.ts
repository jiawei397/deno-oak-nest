// deno-lint-ignore-file no-explicit-any
import { Provider } from "./provider.interface.ts";
import { Type } from "./type.interface.ts";

export interface ModuleMetadata {
  /**
   * Optional list of imported modules that export the providers which are
   * required in this module.
   */
  imports?: any[];
  /**
   * Optional list of controllers defined in this module which have to be
   * instantiated.
   */
  controllers?: Type<any>[];

  /**
   * Optional list of providers that will be instantiated by the Nest injector
   * and that may be shared at least across this module.
   */
  providers?: Provider[];
}

export type ModuleMetadataKey = keyof ModuleMetadata;
export type ModuleMetadataKeys = ModuleMetadataKey[];
