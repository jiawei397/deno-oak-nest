import { type Constructor, Inject, Injectable, INQUIRER, Scope } from "@nest/core";

@Injectable({
  scope: Scope.TRANSIENT,
})
export class LogService {
  parentName: string;

  constructor(@Inject(INQUIRER) private parentClass: Constructor) {
    this.parentName = this.parentClass.name;
  }

  info(message: string) {
    console.log(`[${this.parentName}] ${message}`);
  }
}
