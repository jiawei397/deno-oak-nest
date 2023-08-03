// deno-lint-ignore-file no-explicit-any
import { ajax } from "../tools/ajax.ts";
import {
  Context,
  ForbiddenException,
  UnauthorizedException,
} from "../../deps.ts";
import type { CanActivate } from "../../deps.ts";
import type { SSOGuardOptions, SSOUserInfo } from "../types.ts";
import { isDist, stringify } from "../tools/utils.ts";
import { Injectable, Reflector, SetMetadata } from "../../../../mod.ts";

const SSO_STATUS_META_KEY = "meta:sso:status";

/**
 * 如果不允许外部用户访问，则用此方法跳过限制。
 * 如果允许外部用户访问，则用此方法保护内部接口。
 * @param status
 */
export const Public = (status = true) =>
  SetMetadata(SSO_STATUS_META_KEY, status);

/**
 * sso守卫
 */
export function SSOGuard(options: SSOGuardOptions = {}) {
  const {
    logger = console,
    ssoApi = Deno.env.get("ssoApi"),
    ssoAllowAllUsers,
    ssoUserInfoUrl = "/user/userinfo",
    ssoUserInfosUrl = "/user/list/users_by_id",
    cacheTimeout = 60 * 60 * 1000,
    cacheStore,
    isDebug = !isDist(),
  } = options;

  @Injectable()
  class Guard implements CanActivate {
    constructor(
      private readonly reflector: Reflector,
    ) {}

    async canActivate(context: Context) {
      const b = await this.validateRequest(context);
      if (!b) {
        throw new UnauthorizedException("Unauthorized");
      }
      return b;
    }

    getSimpleUserInfo(user: SSOUserInfo) {
      return {
        id: user.id,
        username: user.username || user.nickname,
      };
    }

    private async getSSO(request: Request) {
      const headers = request.headers;
      let userInfo: SSOUserInfo | undefined;
      const store = typeof cacheStore === "function"
        ? await cacheStore()
        : cacheStore;
      if (headers.get("app") === "1") { // 这是服务端调用的
        const userInfos = await ajax.post<SSOUserInfo[]>(ssoUserInfosUrl, {
          user_ids: [1],
        }, {
          baseURL: ssoApi,
          headers: {
            "user-agent": headers.get("user-agent") || "",
            referer: headers.get("referer") || "",
            "Authorization": headers.get("Authorization") || "",
          },
          cacheTimeout,
          originHeaders: headers,
          cacheStore: store,
          isDebug,
        });
        if (userInfos && userInfos.length > 0) {
          userInfo = userInfos[0];
        }
      } else { // 浏览器调用的
        userInfo = await ajax.get<SSOUserInfo>(ssoUserInfoUrl, null, {
          baseURL: ssoApi,
          headers: {
            cookie: headers.get("cookie") || "",
            "user-agent": headers.get("user-agent") || "",
            referer: headers.get("referer") || "",
          },
          cacheTimeout,
          originHeaders: headers,
          cacheStore: store,
          isDebug,
        });
      }
      if (userInfo) {
        userInfo.id = userInfo.user_id
          ? (userInfo.user_id + "")
          : userInfo.openid;
      }
      return userInfo;
    }

    async validateRequest(context: Context) {
      const request: any = context.request;
      let userInfo: SSOUserInfo | undefined = request.userInfo;
      if (userInfo && userInfo.internal) {
        options.formatUserInfo?.(userInfo, context); // 格式化用户信息，可以增加或修改用户信息
        logger.debug(
          "SSOGuard",
          `上一个guard中已经有用户信息：${
            stringify(this.getSimpleUserInfo(request.userInfo))
          }`,
        );
        return true;
      }
      if (!userInfo) {
        try {
          userInfo = await this.getSSO(request);
        } catch (e) {
          const msg = e.message || e;
          if (msg !== "Unauthorized") {
            logger.error("SSOGuard", `sso校验信息未通过，原因是：${msg}`);
          } else {
            logger.debug("SSOGuard", `sso校验信息Unauthorized`);
          }
          return false;
        }
      }
      if (!userInfo) {
        return false;
      }
      options.formatUserInfo?.(userInfo, context); // 格式化用户信息，可以增加或修改用户信息
      const simpleInfo = this.getSimpleUserInfo(userInfo);
      if (!userInfo.internal) { // 外部用户
        const allowAllUsers = ssoAllowAllUsers ??
          Deno.env.get("ssoAllowAllUsers") === "true";
        const reflectorStatus = this.reflector.get<boolean>(
          SSO_STATUS_META_KEY,
          context,
        );
        let isDisable: boolean;
        if (allowAllUsers) {
          isDisable = reflectorStatus === false; // 在允许所有用户的情况下，要想保护接口，只有使用Public方法
        } else {
          isDisable = reflectorStatus !== true; // 在不允许所有用户的情况下，要想跳过验证，只有使用Public方法
        }
        if (isDisable) {
          logger.error(
            "SSOGuard",
            `外部用户不允许访问private接口：${stringify(simpleInfo)}`,
          );
          throw new ForbiddenException(`没有权限`);
        }
      }
      logger.debug(
        "SSOGuard",
        `校验通过，得到用户信息为：${stringify(simpleInfo)}`,
      );
      request.userInfo = userInfo;
      return true;
    }
  }

  return Guard;
}

/**
 * 清理SSO的缓存，配合一个logout接口使用
 */
export function getClearUserSSOCacheFunc(
  options: Pick<SSOGuardOptions, "ssoApi" | "ssoUserInfoUrl" | "cacheStore"> =
    {},
) {
  const {
    ssoApi = Deno.env.get("ssoApi"),
    ssoUserInfoUrl = "/user/userinfo",
    cacheStore,
  } = options;

  return async (headers: Headers) => {
    const store = typeof cacheStore === "function"
      ? await cacheStore()
      : cacheStore;
    return ajax.clearCacheByConfig({
      url: ssoUserInfoUrl,
      baseURL: ssoApi,
      data: null,
      method: "get",
      headers: {
        cookie: headers.get("cookie") || "",
        "user-agent": headers.get("user-agent") || "",
        referer: headers.get("referer") || "",
      },
      cacheStore: store,
    });
  };
}
