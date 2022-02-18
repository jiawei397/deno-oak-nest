import { DynamicModule } from "../../../src/interfaces/module.interface.ts";
import { ScheduleExplorer } from "./scheduler.explorer.ts";

export class ScheduleModule {
  static forRoot(): DynamicModule {
    return {
      module: ScheduleModule,
      providers: [
        ScheduleExplorer,
      ],
    };
  }
}
