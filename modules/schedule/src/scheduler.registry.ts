import type { Constructor } from "@nest/core";
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
  cronMap: Map<Constructor, CronJob[]> = new Map();
  timeoutMap: Map<Constructor, TimeJob[]> = new Map();
  intervalMap: Map<Constructor, TimeJob[]> = new Map();
  timeCaches: Map<string, number> = new Map();
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

  registerTime(timeKey: number, name?: string): void {
    if (!name) {
      this.#timeNum++;
      name = this.#timeNum.toString();
    }
    this.timeCaches.set(name, timeKey);
  }

  clearTimeoutByKey(timeKey: number): void {
    this.timeCaches.forEach((key, name) => {
      if (key === timeKey) {
        this.clearTimeout(name);
      }
    });
  }

  clearIntervalByKey(timeKey: number): void {
    this.timeCaches.forEach((key, name) => {
      if (key === timeKey) {
        this.clearInterval(name);
      }
    });
  }

  clearTimeout(name: string): void {
    const key = this.timeCaches.get(name);
    if (key) {
      clearTimeout(key);
      this.timeCaches.delete(name);
    }
  }

  clearInterval(name: string): void {
    const key = this.timeCaches.get(name);
    if (key) {
      clearInterval(key);
      this.timeCaches.delete(name);
    }
  }

  addCronJob(target: Constructor, job: CronJob): void {
    this.addJob(target, job, this.cronMap);
  }

  getCronJobs(target: Constructor): CronJob[] | undefined {
    return this.cronMap.get(target);
  }

  addTimeoutJob(target: Constructor, job: TimeJob): void {
    this.addJob(target, job, this.timeoutMap);
  }

  getTimeoutJobs(
    target?: Constructor,
  ): TimeJob[] | Map<Constructor, TimeJob[]> | undefined {
    if (target) {
      return this.timeoutMap.get(target);
    }
    return this.timeoutMap;
  }

  addIntervalJob(target: Constructor, job: TimeJob): void {
    this.addJob(target, job, this.intervalMap);
  }

  getIntervalJobs(target: Constructor): TimeJob[] | undefined {
    return this.intervalMap.get(target);
  }

  //  clearCronJobs(target: Constructor) {
  //   this.cronMap.delete(target);
  // }
}

export const schedulerRegistry: SchedulerRegistry = new SchedulerRegistry();
