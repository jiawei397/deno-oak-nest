import { Controller, Get, getSSEStream, Sse } from "@nest/core";

@Controller("")
export class AppController {
  /**
   * Response an stream, can test by `curl http://localhost:2000/sse`, or use in browser:
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
    const { write, body } = getSSEStream({
      cancel() {
        console.log("canceled");
        clearInterval(st);
      },
    });

    const st = setInterval(() => {
      console.log("send");
      write({
        data: { hello: "world" },
      });
    }, 1000);

    return body;
  }

  @Get("/sse2")
  @Sse()
  sseWithCustomEvent() {
    const { write, body } = getSSEStream({
      cancel() {
        console.log("canceled");
        clearInterval(st);
      },
    });

    let eventId = 1;
    const st = setInterval(() => {
      console.log("send");
      write({
        data: { hello: "world" },
        event: "myEvent",
        id: eventId++,
        retry: 5000,
      });
    }, 1000);

    return body;
  }
}
