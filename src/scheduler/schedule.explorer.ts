import { cron } from "../../deps.ts";
import { Factory } from "../factorys/class.factory.ts";
import { CronJob, schedulerRegistry, TimeJob } from "./scheduler.registry.ts";

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
      const instance = await Factory(target);
      cronJobs.forEach((cronItem: CronJob) => {
        const cronTime = cronItem.cronTime;
        const methodName = cronItem.methodName;
        cron(cronTime, () => {
          instance[methodName]();
        });
      });
    }
  }

  async #startTimeout() {
    if (schedulerRegistry.timeoutMap.size === 0) {
      return;
    }
    for (const [target, timeoutJobs] of schedulerRegistry.timeoutMap) {
      const instance = await Factory(target);
      timeoutJobs.forEach((timeoutItem: TimeJob) => {
        const delay = timeoutItem.delay;
        const methodName = timeoutItem.methodName;
        const jobName = timeoutItem.jobName;
        const timeKey = setTimeout(() => {
          instance[methodName]();
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
      const instance = await Factory(target);
      intervalJobs.forEach((intervalItem: TimeJob) => {
        const delay = intervalItem.delay;
        const methodName = intervalItem.methodName;
        const jobName = intervalItem.jobName;
        const timeKey = setInterval(() => {
          instance[methodName]();
        }, delay);
        schedulerRegistry.registerTime(timeKey, jobName);
      });
    }
  }
}
