import { Context } from "../deps.ts";

// deno-lint-ignore-file camelcase
export type MsgCallback = (...msg: unknown[]) => unknown;

export interface Logger {
  error: MsgCallback;
  warn: MsgCallback;

  info: MsgCallback;
  debug: MsgCallback;
}

/**
 * SSO返回的用户信息
 */
export interface SSOUserInfo {
  id: string; // 转换的user_id，方便前台取值。后台返回的并没有
  openid: string;
  avatar: string;
  email: string;
  internal: boolean;
  last_login: string;
  nickname: string; // 昵称
  phone: string;
  realname: string;
  user_id: number; // 比如81
  username: string;
}

export type SSOUserKey = keyof SSOUserInfo;
export type SSOUserKeys = SSOUserKey[];

export interface User {
  id: string;
  username: string; // 中文名
  enName: string; // 英文名
  email: string;
  state: string;
  external: boolean;
  avatar: string; //图标
  groups?: string[]; //组路径
}

export interface Token {
  id: string;
  userId: string;
  username: string;
  host: string;
  ip?: string;
  userAgent: string;
  expires?: Date;
}

export type AuthGuardOptions = {
  logger?: Logger;
  authApi?: string;
  cacheTimeout?: number;
  isPrivateTokenField?: string;
  privateTokenField?: string;
  checkUserField?: string;
  tokenField?: string;
};

export type SSOGuardOptions = {
  logger?: Logger;
  ssoApi?: string;
  ssoUserAgent?: string;
  ssoUserInfoUrl?: string;
  ssoUserInfosUrl?: string;
  referer?: string;
  cacheTimeout?: number;
  ssoAllowAllUsers?: boolean;
  formatUserInfo?: (user: SSOUserInfo, context: Context) => void;
};
