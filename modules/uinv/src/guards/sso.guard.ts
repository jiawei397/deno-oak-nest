// deno-lint-ignore-file no-explicit-any
import { ajax } from "../tools/ajax.ts";
import { CanActivate, Context, UnauthorizedException } from "../../deps.ts";
import { Logger, SSOUserInfo } from "../types.ts";
import { stringify } from "../tools/utils.ts";

/**
 * sso守卫
 */
export function SSOGuard(options: {
  logger?: Logger;
  ssoApi?: string;
  ssoUserAgent?: string;
  referer?: string;
  cacheTimeout?: number;
  ssoAllowAllUsers?: boolean;
} = {}) {
  const {
    logger = console,
    ssoApi,
    ssoUserAgent,
    ssoAllowAllUsers,
    referer,
    cacheTimeout = 60 * 60 * 1000,
  } = options;
  return class Guard implements CanActivate {
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
        username: user.username,
      };
    }

    async getSSO(
      request: Request & {
        userInfo?: SSOUserInfo;
      },
    ) {
      const headers = request.headers;
      const userInfo = await ajax.get<SSOUserInfo>("/user/userinfo", null, {
        baseURL: ssoApi || Deno.env.get("ssoApi"),
        headers: {
          cookie: headers.get("cookie") || "",
          "user-agent": headers.get("user-agent") || ssoUserAgent ||
            Deno.env.get("ssoUserAgent") || "",
          referer: headers.get("referer") || referer || "",
        },
        cacheTimeout,
      });
      userInfo.id = userInfo.user_id + "";
      request.userInfo = userInfo;
      return userInfo;
    }

    async validateRequest(context: Context) {
      try {
        const request: any = context.request;
        if (request.userInfo) {
          logger.debug(
            `【sso guard】上一个guard中已经有用户信息：${
              stringify(this.getSimpleUserInfo(request.userInfo))
            }`,
          );
          return true;
        }
        const userInfo = await this.getSSO(request);
        const simpleInfo = this.getSimpleUserInfo(userInfo);
        if (
          !userInfo.internal &&
          (!ssoAllowAllUsers && Deno.env.get("ssoAllowAllUsers") !== "true")
        ) { // 外来用户
          logger.error(`【sso guard】外来用户校验信息未通过：${stringify(simpleInfo)}`);
          return false;
        }
        logger.debug(`【sso guard】校验通过，得到用户信息为：${stringify(simpleInfo)}`);
        return true;
      } catch (e) {
        logger.error(`【sso guard】校验信息未通过，原因是：${e.message || e}`);
        return false;
      }
    }
  };
}
