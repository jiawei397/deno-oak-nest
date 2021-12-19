// deno-lint-ignore-file no-explicit-any
import { Constructor } from "../../../src/interfaces/type.interface.ts";
import { schedulerRegistry } from "./scheduler.registry.ts";

export function Cron(cronTime: string): MethodDecorator {
  return function (
    target: InstanceType<Constructor>,
    propertyKey: string | symbol,
    _descriptor: PropertyDescriptor,
  ) {
    schedulerRegistry.addCronJob(target.constructor, {
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
    schedulerRegistry.addTimeoutJob(target.constructor, {
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
    schedulerRegistry.addIntervalJob(target.constructor, {
      delay,
      methodName: propertyKey,
      jobName: name,
    });
  };
}
