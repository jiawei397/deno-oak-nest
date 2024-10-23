export type ListenOptions = {
   /** An {@linkcode AbortSignal} to close the server and all connections. */
   signal?: AbortSignal;

   /** The handler to invoke when route handlers throw an error. */
   onError?: (error: unknown) => Response | Promise<Response>;

   /** The callback which is called when the server starts listening. */
   onListen?: (localAddr: Deno.NetAddr) => void;

   hostname?: string;

   port?: number;
}

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
