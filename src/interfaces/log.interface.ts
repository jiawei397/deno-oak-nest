// deno-lint-ignore-file no-explicit-any
/**
 * @publicApi
 */
export type LogLevel = "log" | "error" | "warn" | "debug";
/**
 * @publicApi
 */
export interface LoggerService {
  /**
   * Write a 'log' level log.
   */
  info(message: any, ...optionalParams: any[]): any;
  /**
   * Write an 'error' level log.
   */
  error(message: any, ...optionalParams: any[]): any;
  /**
   * Write a 'warn' level log.
   */
  warn(message: any, ...optionalParams: any[]): any;
  /**
   * Write a 'debug' level log.
   */
  debug(message: any, ...optionalParams: any[]): any;
}
