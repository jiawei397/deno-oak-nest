import { assert, Injectable } from "../../../../mod.ts";
import { TestService } from "./test.service.ts";
import { Cron, Interval, Timeout } from "../../mod.ts";

@Injectable()
export class ScheduleService {
  constructor(private readonly testService: TestService) {}

  @Timeout(2000)
  onceJob() {
    assert(this.testService, "testService is not defined");
    console.log("-----once---", this.testService.info());
  }

  @Interval(5000)
  async intervalJob() {
    assert(this.testService, "testService is not defined");
    console.log("-----interval---", await this.testService.info());
  }

  @Cron("0 */1 * * * *")
  intervalOneMinuteJob() {
    assert(this.testService, "testService is not defined");
    console.info(
      `【${ScheduleService.name}】one minute interval job!`,
    );
  }

  @Cron("0 */2 * * * *")
  intervalTwoMinuteJob() {
    console.info(`【${ScheduleService.name}】two minute interval job!`);
  }
}