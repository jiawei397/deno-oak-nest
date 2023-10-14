export type ApiPrefixOptions = {
  /**
   * The controller path will check by exclude regExp
   * @example
   * ["^/?v\\d{1,3}/", /^\/?v\d{1,3}\//]
   */
  exclude?: (string | RegExp)[];
};

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
