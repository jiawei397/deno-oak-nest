// deno-lint-ignore-file no-explicit-any
import {
  type Constructor,
  Inject,
  Injectable,
  INQUIRER,
  Scope,
} from "@nest/core";

interface ILogger {
  info(...messages: any[]): void;
  warn(...messages: any[]): void;
  error(...messages: any[]): void;
  debug(...messages: any[]): void;
}

@Injectable({
  scope: Scope.TRANSIENT,
})
export class LoggerService implements ILogger {
  parentName: string;

  constructor(@Inject(INQUIRER) private parentClass: Constructor) {
    this.parentName = this.parentClass.name;
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

  debug(...messages: any[]) {
    this.write("debug", ...messages);
  }

  info(...messages: any[]): void {
    this.write("info", ...messages);
  }

  warn(...messages: any[]): void {
    this.write("warn", ...messages);
  }

  error(...messages: any[]): void {
    this.write("error", ...messages);
  }
}
