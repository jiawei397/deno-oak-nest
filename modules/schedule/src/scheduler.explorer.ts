import { cron } from "../deps.ts";
import {
  type CronJob,
  schedulerRegistry,
  type TimeJob,
} from "./scheduler.registry.ts";
import { Reflect } from "../../../src/deps.ts";
import { APP_CRON_INSTANCE } from "../../../src/constants.ts";

export class ScheduleExplorer {
  onModuleInit() {
    return Promise.all([
      this.#startCron(),
      this.#startTimeout(),
      this.#startInterval(),
    ]);
  }

  async #startCron() {
    if (schedulerRegistry.cronMap.size === 0) {
      return;
    }
    for (const [target, cronJobs] of schedulerRegistry.cronMap) {
      const instance = await Reflect.getMetadata(APP_CRON_INSTANCE, target);
      cronJobs.forEach((cronItem: CronJob) => {
        const cronTime = cronItem.cronTime;
        const methodName = cronItem.methodName;
        cron(cronTime, async () => {
          try {
            await instance[methodName]();
          } catch (err) {
            console.error("ScheduleCronError", err);
          }
        });
      });
    }
  }

  async #startTimeout() {
    if (schedulerRegistry.timeoutMap.size === 0) {
      return;
    }
    for (const [target, timeoutJobs] of schedulerRegistry.timeoutMap) {
      const instance = await Reflect.getMetadata(APP_CRON_INSTANCE, target);

      timeoutJobs.forEach((timeoutItem: TimeJob) => {
        const delay = timeoutItem.delay;
        const methodName = timeoutItem.methodName;
        const jobName = timeoutItem.jobName;
        const timeKey = setTimeout(async () => {
          try {
            await instance[methodName]();
          } catch (err) {
            console.error("ScheduleTimeoutError", err);
          } finally {
            schedulerRegistry.clearTimeoutByKey(timeKey);
          }
        }, delay);
        schedulerRegistry.registerTime(timeKey, jobName);
      });
    }
  }

  async #startInterval() {
    if (schedulerRegistry.intervalMap.size === 0) {
      return;
    }
    for (const [target, intervalJobs] of schedulerRegistry.intervalMap) {
      const instance = await Reflect.getMetadata(APP_CRON_INSTANCE, target);

      intervalJobs.forEach((intervalItem: TimeJob) => {
        const delay = intervalItem.delay;
        const methodName = intervalItem.methodName;
        const jobName = intervalItem.jobName;
        const timeKey = setInterval(async () => {
          try {
            await instance[methodName]();
          } catch (err) {
            console.error("ScheduleIntervalError", err);
          }
        }, delay);
        schedulerRegistry.registerTime(timeKey, jobName);
      });
    }
  }
}
