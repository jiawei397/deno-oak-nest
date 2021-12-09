import { Cron, Injectable, Interval, Timeout } from "../../../mod.ts";

@Injectable()
export class ScheduleService {
  @Timeout(5000)
  onceJob() {
    console.log("-----once---");
  }

  @Interval(5000)
  intervalJob() {
    console.count("-----interval---");
  }

  @Cron("0 */1 * * * *") // 隔1分钟执行一次任务
  intervalOneMinuteJob() {
    console.info(`【${ScheduleService.name}】1分钟执行一次任务！`);
  }
}
