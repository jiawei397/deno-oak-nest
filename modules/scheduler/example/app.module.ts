import { Module } from "../../../mod.ts";
import { ScheduleModule } from "../mod.ts";
import { ScheduleService } from "./services/schedule.service.ts";

@Module({
  imports: [
    ScheduleModule.forRoot(),
  ],
  controllers: [],
  providers: [
    {
      provide: "CONNECTION",
      useValue: "connected",
    },
    ScheduleService,
  ],
})
export class AppModule {}
