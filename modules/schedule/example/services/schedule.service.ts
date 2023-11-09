import { assert, Injectable } from "@nest";
import { Cron, CronExpression, Interval, Timeout } from "../../mod.ts";
import { TestService } from "./test.service.ts";

@Injectable()
export class ScheduleService {
  constructor(private readonly testService: TestService) {
    assert(this.testService, "testService is not defined");
  }

  @Timeout(2000)
  onceJob() {
    assert(this.testService, "testService is not defined");
    console.log("-----once---", this.testService.info());
    setTimeout(() => { // this error only be catched by global error event listener
      throw new Error("once job error");
    }, 0);
  }

  @Timeout(1000)
  promiseError() {
    console.log("-----promise error---");
    new Promise((_resolve, reject) => { // this error only be catched by unhandledrejection event listener
      reject(new Error("promise error"));
    });
  }

  @Interval(5000)
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

  @Cron("45 * * * * *")
  handleCron() {
    console.debug("Called when the current second is 45");
  }

  @Cron(CronExpression.EVERY_MINUTE)
  everyMinute() {
    console.debug("Called when the current minute is 0");
  }
}
