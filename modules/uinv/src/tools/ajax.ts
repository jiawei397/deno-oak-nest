import { AjaxConfig, BaseAjax } from "../../deps.ts";
import { md5 } from "./utils.ts";

class Ajax extends BaseAjax {
  protected getUniqueKey(config: AjaxConfig) {
    // deno-lint-ignore no-explicit-any
    const headers: any = config.headers;
    const key = (config.baseURL || "") + config.url + config.method +
      (config.data ? JSON.stringify(config.data) : "");
    let lastKey = key;
    if (headers) {
      const cookie = headers["cookie"] || headers.get?.("cookie") || "";
      lastKey += cookie;
    }
    return md5(lastKey);
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
