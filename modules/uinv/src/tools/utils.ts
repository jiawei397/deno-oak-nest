// deno-lint-ignore-file no-explicit-any
import { BadRequestException, encode, Hash } from "../../deps.ts";

export function isDist(): boolean {
  return Deno.env.get("NODE_ENV") === "production";
}

export function isDebug(): boolean {
  return Deno.env.get("DEBUG") === "true";
}

export class Cache extends Map {
  private timeout: number;

  constructor(timeout: number = 5 * 1000) {
    super();
    this.timeout = timeout;
  }

  set(key: string | number, val: any, timeout?: number) {
    super.set.call(this, key, val);
    setTimeout(() => {
      this.delete(key);
    }, timeout ?? this.timeout);
    return this;
  }
}

export function makeID(length: number): string {
  let result = "";
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

/** 单位是秒 */
export function getExpireMaxAge(day: number): number {
  return day * 24 * 60 * 60;
}

export function expireDate(day: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + day);
  return date;
}

/** 单位是ms */
export function expireTime(day: number): number {
  return Date.now() + getExpireMaxAge(day * 1000);
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

export function jsonParse(str: string): any {
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

export function md5(str: string) {
  return new Hash("md5").digest(encode(str)).hex();
}

export function delay(time: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, time);
  });
}

export function getIgnoreCaseRegExp(name: string) {
  return new RegExp(["^", name, "$"].join(""), "i");
}

/**
 * 模糊查询正则
 */
export function getVagueIgnoreCaseRegExp(name: string) {
  return new RegExp(name, "i");
}

export function formatDate(date: Date, fmt: string) {
  const o: any = {
    "M+": date.getMonth() + 1, //月份
    "d+": date.getDate(), //日
    "h+": date.getHours() % 12 == 0 ? 12 : date.getHours() % 12, //小时
    "H+": date.getHours(), //小时
    "m+": date.getMinutes(), //分
    "s+": date.getSeconds(), //秒
    "q+": Math.floor((date.getMonth() + 3) / 3), //季度
    "S": date.getMilliseconds(), //毫秒
  };
  if (/(y+)/.test(fmt)) {
    fmt = fmt.replace(
      RegExp.$1,
      (date.getFullYear() + "").substr(4 - RegExp.$1.length),
    );
  }
  for (const k in o) {
    if (new RegExp("(" + k + ")").test(fmt)) {
      fmt = fmt.replace(
        RegExp.$1,
        (RegExp.$1.length == 1)
          ? (o[k])
          : (("00" + o[k]).substr(("" + o[k]).length)),
      );
    }
  }
  return fmt;
}

export function checkParamKey(key: string, val: string) {
  if (!val) {
    throw new BadRequestException(`[${key}] is required`);
  }
}

/**
 * 根据host获取一级域名
 * @param host 正常应该是www.baidu.com，或者localhost
 */
export function getFirstOriginByHost(host: string): string {
  const hostname = host.includes(":") ? host.split(":")[0] : host;
  const arr = hostname.split(".");
  const len = arr.length;
  if (len === 3) { // www.baidu.com， 只处理这种3段的
    return arr[1] + "." + arr[2];
  } else if (len === 4) { // auth.spacex.uino.local这种
    return arr[2] + "." + arr[3];
  }
  return hostname;
}
