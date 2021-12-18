export function isDebug() {
  return Deno.env.get("DEBUG") === "true";
}
