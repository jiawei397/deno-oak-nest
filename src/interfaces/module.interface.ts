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

  exports?: Provider[];
}

export type ModuleMetadataKey = keyof ModuleMetadata;
export type ModuleMetadataKeys = ModuleMetadataKey[];

/**
 * Interface defining a Dynamic Module.
 *
 * @see [Dynamic Modules](https://docs.nestjs.com/modules#dynamic-modules)
 *
 * @publicApi
 */
export interface DynamicModule extends ModuleMetadata {
  /**
   * A module reference
   */
  module: Type<any>;
  // /**
  //  * When "true", makes a module global-scoped.
  //  *
  //  * Once imported into any module, a global-scoped module will be visible
  //  * in all modules. Thereafter, modules that wish to inject a service exported
  //  * from a global module do not need to import the provider module.
  //  *
  //  * @default false
  //  */
  // global?: boolean;
}

export type ModuleType = Type<any> | DynamicModule;
