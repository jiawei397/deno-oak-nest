import { encode, Hash } from "../deps.ts";

export function md5(str: string) {
  return new Hash("md5").digest(encode(str)).hex();
}
