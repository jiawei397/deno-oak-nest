import { type DynamicModule, Module } from "@nest/core";
import type { JwtModuleOptions } from "./jwt.interface.ts";
import { optionKey } from "./jwt.constant.ts";
import { JwtService } from "./jwt.service.ts";
import { generateUniqueKey } from "./jwt.utils.ts";

@Module({})
export class JwtModule {
  static register(options: JwtModuleOptions): DynamicModule {
    return {
      module: JwtModule,
      providers: [
        {
          provide: optionKey,
          useFactory: async () => {
            const secretKey = await generateUniqueKey(options.secret);
            return {
              secretKey,
              signOptions: options.signOptions,
            };
          },
        },
        JwtService,
      ],
      exports: [JwtService],
      global: options.global,
    };
  }
}
