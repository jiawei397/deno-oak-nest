import type { Constructor } from "../../../src/interfaces/type.interface.ts";
export interface CronJob {
  cronTime: string;
  methodName: string | symbol;
}

export interface TimeJob {
  delay: number;
  methodName: string | symbol;
  jobName?: string;
}

class SchedulerRegistry {
  cronMap = new Map<Constructor, CronJob[]>();
  timeoutMap = new Map<Constructor, TimeJob[]>();
  intervalMap = new Map<Constructor, TimeJob[]>();
  timeCaches = new Map<string, number>();
  #timeNum = 0;

  private addJob<T>(
    target: Constructor,
    job: T,
    cacheMap: Map<Constructor, T[]>,
  ) {
    const jobs = cacheMap.get(target);
    if (!jobs) {
      cacheMap.set(target, [job]);
    } else {
      jobs.push(job);
    }
  }

  registerTime(timeKey: number, name?: string) {
    if (!name) {
      this.#timeNum++;
      name = this.#timeNum.toString();
    }
    this.timeCaches.set(name, timeKey);
  }

  clearTimeoutByKey(timeKey: number) {
    this.timeCaches.forEach((key, name) => {
      if (key === timeKey) {
        this.clearTimeout(name);
      }
    });
  }

  clearIntervalByKey(timeKey: number) {
    this.timeCaches.forEach((key, name) => {
      if (key === timeKey) {
        this.clearInterval(name);
      }
    });
  }

  clearTimeout(name: string) {
    const key = this.timeCaches.get(name);
    if (key) {
      clearTimeout(key);
      this.timeCaches.delete(name);
    }
  }

  clearInterval(name: string) {
    const key = this.timeCaches.get(name);
    if (key) {
      clearInterval(key);
      this.timeCaches.delete(name);
    }
  }

  addCronJob(target: Constructor, job: CronJob) {
    this.addJob(target, job, this.cronMap);
  }

  getCronJobs(target: Constructor) {
    return this.cronMap.get(target);
  }

  addTimeoutJob(target: Constructor, job: TimeJob) {
    this.addJob(target, job, this.timeoutMap);
  }

  getTimeoutJobs(target?: Constructor) {
    if (target) {
      return this.timeoutMap.get(target);
    }
    return this.timeoutMap;
  }

  addIntervalJob(target: Constructor, job: TimeJob) {
    this.addJob(target, job, this.intervalMap);
  }

  getIntervalJobs(target: Constructor) {
    return this.intervalMap.get(target);
  }

  //  clearCronJobs(target: Constructor) {
  //   this.cronMap.delete(target);
  // }
}

export const schedulerRegistry = new SchedulerRegistry();
