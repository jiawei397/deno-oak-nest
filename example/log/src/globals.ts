import { type DateFileLogConfig } from "date_log";
import { parse as parseYaml } from "std/yaml/mod.ts";

async function loadYaml<T = unknown>(path: string) {
  const str = await Deno.readTextFile(path);
  return parseYaml(str) as T;
}

interface Config {
  log: DateFileLogConfig;
}

const config: Config = await loadYaml<Config>("config.yaml");

export default config;
