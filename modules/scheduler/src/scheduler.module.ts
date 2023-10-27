import { Module } from "../../../src/decorators/module.ts";
import type { DynamicModule } from "../../../src/interfaces/module.interface.ts";
import { ScheduleExplorer } from "./scheduler.explorer.ts";

@Module({})
export class ScheduleModule {
  static forRoot(): DynamicModule {
    return {
      module: ScheduleModule,
      providers: [
        ScheduleExplorer,
      ],
      exports: [ScheduleExplorer],
      global: true,
    };
  }
}
