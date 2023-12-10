import { parse as parseYaml } from "std/yaml/mod.ts";

export async function loadYaml<T = unknown>(path: string) {
  const str = await Deno.readTextFile(path);
  return parseYaml(str) as T;
}
