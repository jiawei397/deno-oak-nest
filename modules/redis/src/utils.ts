// deno-lint-ignore-file no-explicit-any

export function isDebug(): boolean {
  return Deno.env.get("DEBUG") === "true";
}

export function stringify(data: any): string {
  try {
    return JSON.stringify(data);
  } catch (err) {
    if (isDebug()) {
      console.error("stringify error", data);
      console.error(err);
    }
    return data;
  }
}

export function jsonParse(str: any): any {
  if (!str) return;
  try {
    return JSON.parse(str);
  } catch (err) {
    if (isDebug()) {
      console.error("jsonParse error", str);
      console.error(err);
    }
    return str;
  }
}
