import { Injectable } from "@nest/core";
import config from "../globals.ts";
import { GithubToken, GitHubUserInfo } from "../types.ts";

@Injectable()
export class UserService {
  async get_access_token(code: string) {
    const body = {
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code,
    };

    const response = await fetch(
      `https://github.com/login/oauth/access_token`,
      {
        method: "POST",
        body: JSON.stringify(body),
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      },
    );
    const data: GithubToken = await response.json();
    return data.access_token;
  }

  async get_user_info(access_token: string) {
    const userinfoResult = await fetch(`https://api.github.com/user`, {
      headers: {
        Authorization: `token ${access_token}`,
      },
    });
    const userinfo: GitHubUserInfo = await userinfoResult.json();
    // console.log(userinfo);
    return userinfo;
  }
}
