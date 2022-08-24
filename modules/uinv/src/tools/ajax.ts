import { BaseAjax } from "../../deps.ts";
import type { AjaxConfig } from "../../deps.ts";
import { md5 } from "./utils.ts";

class Ajax extends BaseAjax {
  public getUniqueKey(config: AjaxConfig) {
    const headers = config.headers;
    const keys = [
      config.baseURL,
      config.url,
      config.method,
      config.data ? JSON.stringify(config.data) : "",
    ];
    if (headers) {
      Object.keys(headers).forEach((key) =>
        keys.push(key + "=" + headers[key])
      );
    }
    return md5(keys.filter(Boolean).join("_"));
  }

  /**
   * 处理消息，具体实现可以覆盖此项
   */
  protected handleMessage(_msg: string) {
    // console.log("handleMessage", msg);
    // super.handleMessage(msg);
  }

  /**
   * 处理错误请求
   */
  protected handleErrorResponse(_response: Response) {
    // console.error(
    //     `HTTP error, status = ${response.status}, statusText = ${response.statusText}`,
    // );
  }
}

export const ajax = new Ajax();
