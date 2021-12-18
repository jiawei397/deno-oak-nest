import { DynamicModule } from "../interfaces/module.interface.ts";
import { ScheduleExplorer } from "./schedule.explorer.ts";

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
