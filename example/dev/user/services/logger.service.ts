// deno-lint-ignore-file no-explicit-any
import { Injectable, META_CONTAINER_KEY, Reflect } from "@nest";

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

  /**
   * The parent name was not injected when the service was created
   * @private
   */
  __post__init__() {
    this.parentName = Reflect.getMetadata(META_CONTAINER_KEY, this)?.name;
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
