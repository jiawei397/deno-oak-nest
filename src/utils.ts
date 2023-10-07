// deno-lint-ignore-file no-explicit-any
import { type Context } from "../deps.ts";

export function isDebug() {
  return Deno.env.get("DEBUG") === "true";
}

export function parseSearch(search: string) {
  const str = search.startsWith("?") ? search.substring(1) : search;
  if (!str) {
    return {};
  }
  const arr = str.split("&");
  const map: any = {};
  arr.forEach((item) => {
    const [k, v] = item.split("=");
    if (map[k]) {
      map[k] = [...map[k], v];
    } else {
      map[k] = v;
    }
  });
  return map;
}

export interface ReadableStreamResult {
  body: ReadableStream;
  /** write message to stream, but it may cause error if the connection closed before */
  write(message: string): void;
  /** write last message and end signal to stream, but it may cause error if the connection closed before */
  end(message?: string): void;
}

export function setCacheControl(context: Context) {
  // cache-control see https://cloud.tencent.com/developer/section/1189911
  const requestCacheControl = context.req.header("Cache-Control");
  let responseCacheControl = context.res.headers.get("Cache-Control");
  if (!responseCacheControl) {
    if (requestCacheControl) {
      const cacheArr = requestCacheControl.split(",");
      const cacheResHeaders = [
        "max-age",
        "no-cache",
        "no-store",
        "no-transform",
      ];
      responseCacheControl = cacheArr.filter((str) => {
        const key = str.split("=")[0];
        return cacheResHeaders.includes(key.trim().toLowerCase());
      }).join(",");
    } else {
      responseCacheControl = "no-cache";
    }
    context.res.headers.set("Cache-Control", responseCacheControl);
  }
}

export function getReadableStream(): ReadableStreamResult {
  let controller: ReadableStreamDefaultController;
  const body = new ReadableStream({
    start(_controller) {
      controller = _controller;
    },
  });
  const te = new TextEncoder();
  return {
    body,
    write(message: string) {
      controller.enqueue(te.encode(message));
    },
    end(message?: string) {
      if (message) {
        controller.enqueue(te.encode(message));
      }
      controller.close();
    },
  };
}
