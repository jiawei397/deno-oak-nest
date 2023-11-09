import { Module } from "@nest";
import { ScheduleModule } from "@nest/schedule";
import { ScheduleService } from "./services/schedule.service.ts";
import { Test2Service } from "./services/test2.service.ts";

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
    Test2Service,
  ],
})
export class AppModule {}
