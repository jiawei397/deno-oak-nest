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

export async function checkEtag(context: Context, val: any) {
  if (!val) {
    context.response.body = val;
    return val;
  }
  const etag = context.request.headers.get("If-None-Match");
  const str = typeof val === "string" ? val : JSON.stringify(val);
  const etagOptions = { weak: true };
  const actual = await calculate(str, etagOptions);
  context.response.headers.set("etag", actual);

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
  }

  context.response.headers.set("Cache-Control", responseCacheControl);
  if (
    etag && !await ifNoneMatch(etag, str, etagOptions) // if etag is not match, then will return 200
  ) {
    context.response.status = 304;
    context.response.body = undefined;
  } else {
    context.response.body = val;
  }
  return val;
}
