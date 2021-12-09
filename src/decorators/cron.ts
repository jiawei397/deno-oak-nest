// deno-lint-ignore-file no-explicit-any
import { cron } from "../../deps.ts";

export function Cron(cronTime: string): MethodDecorator {
  return function (
    _target: any,
    _propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) {
    cron(cronTime, descriptor.value);
    return descriptor;
  };
}

export function Timeout(delay: number, name?: string): MethodDecorator {
  return function (
    target: any,
    _propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) {
    const timeKey = setTimeout(() => {
      descriptor.value.call(target);
    }, delay);
    SchedulerRegistry.registerTime(timeKey, name);
    return descriptor;
  };
}

export function Interval(delay: number, name?: string): MethodDecorator {
  return function (
    target: any,
    _propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) {
    const timeKey = setInterval(() => {
      descriptor.value.call(target);
    }, delay);
    SchedulerRegistry.registerTime(timeKey, name);
    return descriptor;
  };
}

export class SchedulerRegistry {
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
}
