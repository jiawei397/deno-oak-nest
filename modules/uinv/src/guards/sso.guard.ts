// deno-lint-ignore-file no-explicit-any
import { ajax } from "../tools/ajax.ts";
import { CanActivate, Context, UnauthorizedException } from "../../deps.ts";
import { SSOGuardOptions, SSOUserInfo } from "../types.ts";
import { stringify } from "../tools/utils.ts";
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
    ssoUserAgent,
    ssoAllowAllUsers,
    ssoUserInfoUrl = "/user/userinfo",
    ssoUserInfosUrl = "/user/list/users_by_id",
    referer,
    cacheTimeout = 60 * 60 * 1000,
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
        id: user.user_id,
        username: user.username || user.nickname,
      };
    }

    private async getSSO(request: Request) {
      const headers = request.headers;
      let userInfo: SSOUserInfo | undefined;
      const userAgent = headers.get("user-agent") || ssoUserAgent ||
        Deno.env.get("ssoUserAgent") || "";
      const realReferer = headers.get("referer") || referer || "";
      if (headers.get("app") === "1") {
        const userInfos = await ajax.post<SSOUserInfo[]>(ssoUserInfosUrl, {
          user_ids: [1],
        }, {
          baseURL: ssoApi,
          headers: {
            "user-agent": userAgent,
            referer: realReferer,
            "Authorization": headers.get("Authorization") || "",
          },
          cacheTimeout,
        });
        if (userInfos && userInfos.length > 0) {
          userInfo = userInfos[0];
        }
      } else {
        userInfo = await ajax.get<SSOUserInfo>(ssoUserInfoUrl, null, {
          baseURL: ssoApi,
          headers: {
            cookie: headers.get("cookie") || "",
            "user-agent": userAgent,
            referer: realReferer,
          },
          cacheTimeout,
        });
      }
      if (userInfo) {
        userInfo.id = userInfo.user_id + "";
      }
      return userInfo;
    }

    async validateRequest(context: Context) {
      try {
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
          userInfo = await this.getSSO(request);
        }
        if (!userInfo) {
          return false;
        }
        options.formatUserInfo?.(userInfo, context); // 格式化用户信息，可以增加或修改用户信息
        const simpleInfo = this.getSimpleUserInfo(userInfo);
        if (!userInfo.internal) { // 外部用户
          const allowAllUsers = ssoAllowAllUsers ??
            Deno.env.get("ssoAllowAllUsers") === "true";
          if (allowAllUsers) {
            const isDisable = this.reflector.get<boolean>(
              SSO_STATUS_META_KEY,
              context,
            ) === false; // 在允许所有用户的情况下，要想保护接口，只有使用Public方法
            if (isDisable) {
              logger.error(
                "SSOGuard",
                `外部用户不允许访问private接口：${stringify(simpleInfo)}`,
              );
              return false;
            }
          } else {
            const isAllow = this.reflector.get<boolean>(
              SSO_STATUS_META_KEY,
              context,
            ) === true; // 在不允许所有用户的情况下，要想跳过验证，只有使用Public方法
            if (!isAllow) {
              logger.error(
                "SSOGuard",
                `外部用户校验信息未通过：${stringify(simpleInfo)}`,
              );
              return false;
            }
          }
        }
        logger.debug("SSOGuard", `校验通过，得到用户信息为：${stringify(simpleInfo)}`);
        request.userInfo = userInfo;
        return true;
      } catch (e) {
        logger.error("SSOGuard", `校验信息未通过，原因是：${e.message || e}`);
        return false;
      }
    }
  }

  return Guard;
}
