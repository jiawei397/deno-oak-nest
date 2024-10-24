// deno-lint-ignore-file no-explicit-any
import {
  type Constructor,
  Inject,
  Injectable,
  INQUIRER,
  Scope,
} from "@nest/core";
import { getLogger, initLog } from "date_log";
import globals from "./globals.ts";

initLog(globals.log);

export const logger = getLogger();

@Injectable({
  scope: Scope.TRANSIENT,
})
export class Logger {
  private parentName?: string;

  constructor(@Inject(INQUIRER) private parentClass: Constructor) {
    this.parentName = this.parentClass.name;
  }

  private write(
    methodName: "warning" | "info" | "debug" | "error",
    ...messages: any[]
  ): void {
    if (this.parentName) {
      logger[methodName](this.parentName, ...messages);
    } else {
      const [first, ...others] = messages;
      logger[methodName](first, ...others);
    }
  }

  debug(...messages: any[]): void {
    this.write("debug", ...messages);
  }

  info(...messages: any[]): void {
    this.write("info", ...messages);
  }

  warn(...messages: any[]): void {
    this.write("warning", ...messages);
  }

  error(...messages: any[]): void {
    this.write("error", ...messages);
  }
}
