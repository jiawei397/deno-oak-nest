import { Inject, Injectable } from "@nest";
import type { EnvConfig } from "./config.interface.ts";
import { CONFIG_KEY } from "./config.constant.ts";

@Injectable()
export class ConfigService {
  constructor(
    @Inject(CONFIG_KEY) private readonly envConfig: EnvConfig,
  ) {}

  get(key: string): string {
    return this.envConfig[key];
  }
}
