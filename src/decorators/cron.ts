// deno-lint-ignore-file no-explicit-any
import { cron } from "../../deps.ts";
import { Factory } from "../factorys/class.factory.ts";
import { Constructor } from "../interfaces/type.interface.ts";

export interface CronJob {
  cronTime: string;
  methodName: string | symbol;
}

export interface TimeJob {
  delay: number;
  methodName: string | symbol;
  jobName?: string;
}

export function Cron(cronTime: string): MethodDecorator {
  return function (
    target: InstanceType<Constructor>,
    propertyKey: string | symbol,
    _descriptor: PropertyDescriptor,
  ) {
    SchedulerRegistry.addCronJob(target.constructor, {
      cronTime,
      methodName: propertyKey,
    });
  };
}

export function Timeout(delay: number, name?: string): MethodDecorator {
  return function (
    target: any,
    propertyKey: string | symbol,
    _descriptor: PropertyDescriptor,
  ) {
    SchedulerRegistry.addTimeoutJob(target.constructor, {
      delay,
      methodName: propertyKey,
      jobName: name,
    });
  };
}

export function Interval(delay: number, name?: string): MethodDecorator {
  return function (
    target: any,
    propertyKey: string | symbol,
    _descriptor: PropertyDescriptor,
  ) {
    SchedulerRegistry.addIntervalJob(target.constructor, {
      delay,
      methodName: propertyKey,
      jobName: name,
    });
  };
}

export class SchedulerRegistry {
  static cronMap = new Map<Constructor, CronJob[]>();
  static timeoutMap = new Map<Constructor, TimeJob[]>();
  static intervalMap = new Map<Constructor, TimeJob[]>();
  static timeCaches = new Map<string, number>();
  static #timeNum = 0;

  static registerTime(timeKey: number, name?: string) {
    if (!name) {
      this.#timeNum++;
      name = this.#timeNum.toString();
    }
    this.timeCaches.set(name, timeKey);
  }

  static clearTimeout(name: string) {
    const key = this.timeCaches.get(name);
    if (key) {
      clearTimeout(key);
    }
  }

  static clearInterval(name: string) {
    const key = this.timeCaches.get(name);
    if (key) {
      clearInterval(key);
    }
  }

  static addCronJob(target: Constructor, job: CronJob) {
    const cronJobs = this.cronMap.get(target);
    if (!cronJobs) {
      this.cronMap.set(target, [job]);
    } else {
      cronJobs.push(job);
    }
  }

  static getCronJobs(target: Constructor) {
    return this.cronMap.get(target);
  }

  static addTimeoutJob(target: Constructor, job: TimeJob) {
    const timeoutJobs = this.timeoutMap.get(target);
    if (!timeoutJobs) {
      this.timeoutMap.set(target, [job]);
    } else {
      timeoutJobs.push(job);
    }
  }

  static getTimeoutJobs(target: Constructor) {
    return this.timeoutMap.get(target);
  }

  static addIntervalJob(target: Constructor, job: TimeJob) {
    const intervalJobs = this.intervalMap.get(target);
    if (!intervalJobs) {
      this.intervalMap.set(target, [job]);
    } else {
      intervalJobs.push(job);
    }
  }

  static getIntervalJobs(target: Constructor) {
    return this.intervalMap.get(target);
  }

  // static clearCronJobs(target: Constructor) {
  //   this.cronMap.delete(target);
  // }
}

export class ScheduleModule {
  static forRoot() {
    return Promise.all([
      this.startCron(),
      this.startTimeout(),
      this.startInterval(),
    ]);
  }

  static async startCron() {
    if (SchedulerRegistry.cronMap.size === 0) {
      return;
    }
    for (const [target, cronJobs] of SchedulerRegistry.cronMap) {
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

  static async startTimeout() {
    if (SchedulerRegistry.timeoutMap.size === 0) {
      return;
    }
    for (const [target, timeoutJobs] of SchedulerRegistry.timeoutMap) {
      const instance = await Factory(target);
      timeoutJobs.forEach((timeoutItem: TimeJob) => {
        const delay = timeoutItem.delay;
        const methodName = timeoutItem.methodName;
        const jobName = timeoutItem.jobName;
        const timeKey = setTimeout(() => {
          instance[methodName]();
        }, delay);
        SchedulerRegistry.registerTime(timeKey, jobName);
      });
    }
  }

  static async startInterval() {
    if (SchedulerRegistry.intervalMap.size === 0) {
      return;
    }
    for (const [target, intervalJobs] of SchedulerRegistry.intervalMap) {
      const instance = await Factory(target);
      intervalJobs.forEach((intervalItem: TimeJob) => {
        const delay = intervalItem.delay;
        const methodName = intervalItem.methodName;
        const jobName = intervalItem.jobName;
        const timeKey = setInterval(() => {
          instance[methodName]();
        }, delay);
        SchedulerRegistry.registerTime(timeKey, jobName);
      });
    }
  }
}
