import { Controller, Get, getSSEStream, Sse } from "@nest";

@Controller("")
export class AppController {
  /**
   * response an stream, can test by `curl http://localhost:2000/sse`
   *
   * @example
   * ```ts
   * const eventSource = new EventSource("http://localhost:2000/sse");
   * eventSource.onmessage = (event) => {
   *  console.log(event.data);
   * };
   * eventSource.onerror = (event) => {
   *  console.error(event);
   * };
   * eventSource.addEventListener("myEvent", (event) => {
   *  console.log(event.data);
   * });
   * eventSource.close();
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events
   */
  @Get("/sse")
  @Sse()
  sse() {
    const stream = getSSEStream({
      cancel() {
        console.log("canceled");
        clearInterval(st);
      },
    });

    let eventId = 1;
    const st = setInterval(() => {
      console.log("send");
      stream.write({
        data: { hello: "world" },
        event: "myEvent",
        id: eventId++,
        retry: 5000,
      });
    }, 1000);

    return stream.body;
  }
}
