export const APP_INTERCEPTOR = "APP_INTERCEPTOR";
export const APP_GUARD = "APP_GUARD";
export const APP_FILTER = "APP_FILTER";

export const APP_CRON = Symbol("APP_CRON");
export const APP_CRON_INSTANCE = Symbol("APP_CRON_INSTANCE");

/**
 * Used for inject the parent class of the current class. It must used with `@Injectable` decorator and scope should be `Scope.TRANSIENT`
 *
 * @example
 *
 * ```typescript
 * export class LogService {
 *   parentName: string;
 *
 *   constructor(@Inject(INQUIRER) private parentClass: Constructor) {
 *     this.parentName = this.parentClass.name;
 *   }
 * }
 * ```
 */
export const INQUIRER = "INQUIRER";
