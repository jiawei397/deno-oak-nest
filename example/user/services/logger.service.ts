// deno-lint-ignore-file no-explicit-any
import { Injectable } from "../../../src/decorators/inject.ts";
import { Reflect } from "../../../deps.ts";

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
  debug(...messages: any[]): void {
    if (this.pre) {
      console.debug(this.pre, ...messages);
    } else {
      console.debug(...messages);
    }
  }

  #pre: string | undefined;

  get pre() {
    if (this.#pre) {
      return this.#pre;
    }
    const parent = Reflect.getMetadata("meta:container", this);
    if (parent) {
      this.#pre = parent.name;
      return this.#pre;
    }
    return null;
  }

  info(...messages: any[]) {
    if (this.pre) {
      console.log(this.pre, ...messages);
    } else {
      console.info(...messages);
    }
  }

  warn(...messages: any[]) {
    if (this.pre) {
      console.warn(this.pre, ...messages);
    } else {
      console.warn(...messages);
    }
  }

  error(...messages: any[]) {
    if (this.pre) {
      console.error(this.pre, ...messages);
    } else {
      console.error(...messages);
    }
  }
}
