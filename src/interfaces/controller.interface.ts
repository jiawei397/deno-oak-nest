export type AliasOptions = {
  /**
   * The alias path, if not set, the path will be the same as the normal path.
   */
  alias?: string;
  /**
   * If true, the alias will be used as the path, and only the alias will be used as the path.
   *
   * If the alias is set too, the normal path will be ignored.
   */
  isAliasOnly?: boolean;
};

export interface SSEMessageEvent {
  data: string | object;
  /**
   * The event id.
   */
  id?: string | number;
  /**
   * Retry time in milliseconds for reconnection, unit is milliseconds.
   */
  retry?: number;
  /**
   * The event name, if not set, the event name will be `message`.
   * If the event name is set too, the event name will be used as the event name.
   *
   *  @example
   * ```ts
   * const eventSource = new EventSource("http://localhost:2000/sse");
   * eventSource.addEventListener("myEvent", (event) => {
   *  console.log(event.data);
   * });
   * ```
   */
  event?: string;
}
