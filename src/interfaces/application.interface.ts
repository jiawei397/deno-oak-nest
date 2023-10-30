/**
 * The options of the application
 * @param [onError] the error handler not tested ok
 */
export type ListenOptions = Deno.ServeOptions;

/**
 * System signals which shut down a process
 *
 * @description On Windows only "SIGINT" (CTRL+C) and "SIGBREAK" (CTRL+Break) are supported.
 */
export type ShutdownSignal =
  | "SIGHUP"
  | "SIGINT"
  | "SIGQUIT"
  | "SIGILL"
  | "SIGTRAP"
  | "SIGABRT"
  | "SIGBUS"
  | "SIGFPE"
  | "SIGSEGV"
  | "SIGUSR2"
  | "SIGTERM";
