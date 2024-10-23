import { nanoid } from "../../deps.ts";
import type {
  AccessTokenResult,
  BaseResult,
  GetAccessTokenOptions,
  GetAutoOpenAPIOptions,
  GetOpenAPIOptions,
} from "../types.ts";
import { ajax } from "./ajax.ts";

export async function getAccessToken(
  params: GetAccessTokenOptions,
): Promise<AccessTokenResult> {
  const state = nanoid();
  const url =
    `https://open.uino.com/sso/v2/oauth/get_token?client_id=${params.client_id}&client_secret=${params.client_secret}&state=${state}&scope=${params.scope}`;
  const headers: Record<string, string> = {
    "user-agent": params.user_agent,
  };
  const response = await ajax.get<BaseResult<AccessTokenResult>>(url, null, {
    headers,
    originHeaders: params.originHeaders,
    cacheTimeout: params.cacheTimeout ?? 1000 * 60 * 60,
  });
  if (!response.success) {
    return Promise.reject(response.message);
  }
  return response.data;
}

export async function getOpenApi<T>(params: GetOpenAPIOptions): Promise<T> {
  const authorization = `${params.authorizationType} ${
    btoa(params.client_id + ":" + params.access_token)
  }`;
  const response = await ajax.ajax<BaseResult<T>>({
    url: params.url,
    method: params.method || "GET",
    data: params.body,
    headers: {
      "user-agent": params.user_agent,
      "Authorization": authorization,
    },
    originHeaders: params.originHeaders,
    cacheTimeout: params.apiCacheTimeout,
  });
  if (!response.success) {
    return Promise.reject(response.message);
  }
  return response.data;
}

export async function getAutoOpenApi<T>(params: GetAutoOpenAPIOptions) {
  const access_token_result = await getAccessToken(params);
  return getOpenApi<T>({
    ...params,
    access_token: access_token_result.access_token,
  });
}
