// deno-lint-ignore-file no-explicit-any
import { ajax } from "../tools/ajax.ts";
import {
  CanActivate,
  Context,
  Request,
  UnauthorizedException,
} from "../../deps.ts";
import { AuthGuardOptions, Token, User } from "../types.ts";
import { getFirstOriginByHost, isDist } from "../tools/utils.ts";

/**
 * auth守卫
 */
export function AuthGuard(options: AuthGuardOptions = {}) {
  const {
    logger = console,
    authApi = Deno.env.get("authApi"),
    privateTokenField = "token",
    isPrivateTokenField = "is-private-token",
    checkUserField = "userid",
    tokenField = "authorization",
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

    async validateRequest(context: Context) {
      const request = context.request;
      const headers = request.headers;
      let b;
      if (headers.get(isPrivateTokenField)) {
        logger.debug(
          `【${AuthGuard.name}】正在使用private_token校验，headers中${isPrivateTokenField}值为${
            headers.get(isPrivateTokenField)
          }`,
        );
        b = await this.checkPrivateToken(headers, request);
      } else {
        logger.debug(`【${AuthGuard.name}】使用cookie校验`);
        b = await this.checkToken(headers, context);
      }
      if (!b) {
        throw new UnauthorizedException("Unauthorized");
      }
      return true;
    }

    private async checkPrivateToken(
      headers: Headers,
      req: Request & {
        userInfo?: User;
      },
    ): Promise<boolean | User> {
      const userVal = headers.get(checkUserField);
      if (!userVal) {
        logger.warn(`【${AuthGuard.name}】headers中未找到【${checkUserField}】`);
        return false;
      }
      const token = headers.get(privateTokenField);
      if (!token) {
        logger.warn(`【${AuthGuard.name}】headers中未找到【${privateTokenField}】`);
        return false;
      }
      const userAgent = headers.get("user-agent");
      if (!userAgent) {
        logger.warn(`【${AuthGuard.name}】headers中未找到【user-agent】`);
        return false;
      }
      try {
        const result = await this.getUserInfoByPrivateToken(token, headers);
        if (result) {
          if (result.id == userVal) {
            //这里用双等于，可能会是数字
            logger.info(
              `【${AuthGuard.name}】${userVal}使用private_token校验通过！[user-agent]是${userAgent}`,
            );
            req.userInfo = result;
            return true;
          } else {
            logger.warn(
              `【${AuthGuard.name}】用户id不匹配！从headers中传递过来的是【${userVal}】，但从gitlab得到的是【${result.id}】`,
            );
          }
        } else {
          logger.warn(`【${AuthGuard.name}】调用getUserInfoByPrivateToken，未拿到数据`);
        }
      } catch (e) {
        logger.error(
          `【${AuthGuard.name}】调用getUserInfoByPrivateToken报错，错误信息为：${e.message}`,
        );
      }
      return false;
    }

    private getUserInfoByPrivateToken(token: string, headers: Headers) {
      logger.debug(`【AuthGuard】getUserInfoByPrivateToken，参数为：${token}`);
      return ajax.get<User>("/user/getUserInfoByGitlabPrivateToken", {
        token,
      }, {
        baseURL: authApi,
        headers: this.pickHeaders(headers),
        cacheTimeout,
      });
    }

    async findToken(context: Context) {
      let token: string | null | undefined = await context.cookies.get(
        tokenField,
      );
      if (!isDist() && !token) { //开发时，找不到再到headers中找
        token = context.request.headers.get(tokenField);
      }
      if (token) {
        token = decodeURIComponent(token);
      }
      if (!token) {
        logger.error(`未找到${tokenField}！`);
        return;
      }
      return token;
    }

    private pickHeaders(headers: Headers) {
      return {
        cookie: headers.get("cookie") || "",
        authorization: headers.get("authorization") || "",
        "user-agent": headers.get("user-agent") || "",
        referer: headers.get("referer") || "",
      };
    }

    private getTokenInfoInDb(token: string, headers: Headers) {
      logger.debug(`【AuthGuard】getTokenInfoInDb，参数为：${token}`);
      return ajax.post<Token>("/user/getTokenInfoInDb", {
        token,
      }, {
        baseURL: authApi,
        headers: this.pickHeaders(headers),
        cacheTimeout,
      });
    }

    async checkToken(headers: Headers, context: Context) {
      try {
        const token = await this.findToken(context);
        if (!token) {
          logger.error(`【SimpleGuard】checkToken失败`);
          return false;
        }
        const find = await this.getTokenInfoInDb(
          token,
          context.request.headers,
        );
        if (!find) {
          throw new Error("checkExtTokenInfo返回错误");
        }
        const checked = this.checkExtTokenInfo(find, headers);
        if (!checked) {
          return false;
        }
        (context.request as any).userInfo = {
          userId: find.userId,
          username: find.username,
          token: find.id,
        };
        return true;
      } catch (e) {
        logger.error(
          `【SimpleGuard】checkExtTokenInfo error and message is ${e.message}`,
        );
      }
      return false;
    }

    /**
     * 校验额外的信息
     */
    checkExtTokenInfo(tokenRes: Token, headers: Headers) {
      try {
        if (!isDist()) {
          // 开发模式下不校验这些了
          logger.debug(`【${AuthGuard.name}】开发环境下不校验token`);
          return true;
        }
        logger.debug(
          `记录的ip是【${tokenRes.ip}】，headers中是【${headers.get("x-real-ip")}】`,
        );
        const userAgent = headers.get("user-agent");
        if (tokenRes.userAgent !== userAgent) {
          logger.error(
            `【${AuthGuard.name}】userAgent不一致！记录的是【${tokenRes.userAgent}】，但headers中是【${userAgent}】`,
          );
          return false;
        }
        const host = headers.get("host") || "";
        if (
          getFirstOriginByHost(tokenRes.host) !==
            getFirstOriginByHost(host)
        ) {
          logger.error(
            `【${AuthGuard.name}】host不一致！记录的是【${tokenRes.host}】，但headers中是【${host}】`,
          );
          return false;
        }
        return true;
      } catch (e) {
        logger.error(
          `【${AuthGuard.name}】checkExtTokenInfo报错，错误信息为：【${e.message}】`,
        );
        return false;
      }
    }
  };
}
