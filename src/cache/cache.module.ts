import { DynamicModule } from "../interfaces/module.interface.ts";
import { optionKey } from "./cache.constant.ts";
import { CacheInterceptor } from "./cache.interceptor.ts";
import { CacheModuleOptions } from "./cache.interface.ts";

export class CacheModule {
  static register(options?: CacheModuleOptions): DynamicModule {
    return {
      module: CacheModule,
      providers: [
        {
          provide: optionKey,
          useValue: options,
        },
        CacheInterceptor,
      ],
    };
  }
}
