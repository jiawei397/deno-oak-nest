import { type DynamicModule, Module } from "@nest/core";
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
