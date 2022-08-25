import { BaseAjax } from "../../deps.ts";

class Ajax extends BaseAjax {
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
