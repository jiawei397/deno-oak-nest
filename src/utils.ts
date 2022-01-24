export function isDebug() {
  return Deno.env.get("DEBUG") === "true";
}

export function parseSearch(search: string) {
  const str = search.startsWith("?") ? search.substring(1) : search;
  if (!str) {
    return {};
  }
  const arr = str.split("&");
  // deno-lint-ignore no-explicit-any
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
