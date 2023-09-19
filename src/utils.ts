// deno-lint-ignore-file no-explicit-any
import { calculate, Context, ifNoneMatch } from "../deps.ts";

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

/**
 * check etag and set etag header
 * @returns If the etag is not match, then return false, else return true
 */
export async function checkEtag(context: Context, val: any) {
  if (!val) {
    context.response.body = val;
    return false;
  }
  const str = typeof val === "string" ? val : JSON.stringify(val);
  const etagOptions = { weak: true };
  const actual = await calculate(str, etagOptions);
  if (!actual) {
    return false;
  }
  const etag = context.request.headers.get("If-None-Match");
  if (
    etag && !ifNoneMatch(etag, actual) // if etag is not match, then will return 200
  ) {
    context.response.status = 304;
    context.response.body = undefined;
    context.response.headers.set("etag", etag);
    return true;
  } else {
    context.response.headers.set("etag", actual);
    context.response.body = val;
    return false;
  }
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
  const requestCacheControl = context.request.headers.get("Cache-Control");
  let responseCacheControl = context.response.headers.get("Cache-Control");
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
    context.response.headers.set("Cache-Control", responseCacheControl);
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

export const _internals = { ifNoneMatch };
