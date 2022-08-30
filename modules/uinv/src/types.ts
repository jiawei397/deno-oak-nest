import { AjaxData, Context, ICacheStore, Method } from "../deps.ts";

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
  originInternal?: boolean; // 原始的internal，上面的internal可能被修改
  last_login: string;
  nickname: string; // 昵称
  phone: string;
  realname: string;
  user_id: number;
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

export type ICacheStoreFunc = () => Promise<ICacheStore>;

export type AuthGuardOptions = {
  logger?: Logger;
  authApi?: string;
  cacheTimeout?: number;
  isPrivateTokenField?: string;
  privateTokenField?: string;
  checkUserField?: string;
  tokenField?: string;
  cacheStore?: ICacheStore | ICacheStoreFunc;
  isDebug?: boolean;
};

export type SSOGuardOptions = {
  logger?: Logger;
  ssoApi?: string;
  ssoUserAgent?: string;
  ssoUserInfoUrl?: string;
  ssoUserInfosUrl?: string;
  referer?: string;
  cacheTimeout?: number;
  cacheStore?: ICacheStore | ICacheStoreFunc;
  ssoAllowAllUsers?: boolean;
  formatUserInfo?: (user: SSOUserInfo, context: Context) => void;
  isDebug?: boolean;
};

export type BaseResult<T> = {
  code: string;
  request_id: string;
  data: T;
  success: boolean;
  message: string | null;
};

export type AccessTokenResult = {
  access_token: string;
  expires_in: number;
  scope: Scope[];
  created_at: number;
  state: number;
};

export type Scope =
  | "openid"
  | "read_userinfo"
  | "read_userinfo_by_phone"
  | "mmd_id"
  | "wecom";

export type AuthorizationType = "Basic" | "Bearer";

export interface GetAccessTokenOptions {
  client_id: string;
  client_secret: string;
  user_agent: string;
  scope: Scope;
  originHeaders?: Headers;
  cacheTimeout?: number;
}

export interface GetOpenAPIOptions {
  client_id: string;
  access_token: string;
  user_agent: string;
  url: string;
  method: Method;
  authorizationType: AuthorizationType;
  body?: AjaxData;
  originHeaders?: Headers;
  apiCacheTimeout?: number;
}

export type GetAutoOpenAPIOptions =
  & GetAccessTokenOptions
  & Omit<GetOpenAPIOptions, "access_token">;
