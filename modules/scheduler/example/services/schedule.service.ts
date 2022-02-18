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
    // setTimeout(() => { // cannot catch timeout error, must in promise
    throw new Error("once job error");
    // }, 0);
  }

  @Interval(500)
  async intervalJob() {
    assert(this.testService, "testService is not defined");
    console.log("-----interval---", await this.testService.info());
    // throw new Error("interval job error");
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
