// deno-lint-ignore-file no-explicit-any
import { Injectable } from "../../../src/decorators/inject.ts";
import { Reflect } from "../../../deps.ts";
import { bind } from "../../../src/decorators/bind.ts";

interface ILogger {
  info(...messages: any[]): void;
  warn(...messages: any[]): void;
  error(...messages: any[]): void;
  debug(...messages: any[]): void;
}

@Injectable({
  singleton: false,
})
export class LoggerService implements ILogger {
  private parentName?: string;

  constructor() {
    this.parentName = Reflect.getMetadata("meta:container", this)?.name;
  }

  private write(
    methodName: "warn" | "info" | "debug" | "error",
    ...messages: any[]
  ): void {
    if (this.parentName) {
      console[methodName](this.parentName, ...messages);
    } else {
      const [first, ...others] = messages;
      console[methodName](first, ...others);
    }
  }

  @bind
  debug(...messages: any[]) {
    this.write("debug", ...messages);
  }

  @bind
  info(...messages: any[]): void {
    this.write("info", ...messages);
  }

  @bind
  warn(...messages: any[]): void {
    this.write("warn", ...messages);
  }

  @bind
  error(...messages: any[]): void {
    this.write("error", ...messages);
  }
}
