import { HttpException, Catch, type ExceptionFilter } from "@nest/core";
import type { Context } from "../deps.ts";
import type { Logger } from "./types.ts";

function getDefaultErrorBody(
  exception: unknown,
  ctx: Context,
) {
  return {
    statusCode: (exception as HttpException).status || 500,
    message: (exception as HttpException | Error).message || exception,
    path: ctx.request.url,
    type: "anyExceptionFilter",
  };
}

/**
 * An ExceptionFilter that will deal the exceptions when called.
 *
 * ```ts
 * import { anyExceptionFilter } from "https://deno.land/x/deno_nest/modules/uinv/mod.ts";
 *
 * app.useGlobalFilters(anyExceptionFilter({
 *  logger: console,
 *  isDisableFormat404: true,
 *  isLogCompleteError: true,
 *  isIgnoreLog401: true,
 * }));
 * ```
 */
export const anyExceptionFilter = (options: ExceptionOptions = {}) => {
  const {
    logger = console,
    isDisableFormat404,
    isLogCompleteError,
    getErrorBody = getDefaultErrorBody,
    filter,
    defaultErrorStatus = 500,
    isIgnoreLog401,
    ignoreResponseLog,
  } = options;

  @Catch()
  class AllExceptionsFilter implements ExceptionFilter {
    async catch(exception: unknown, ctx: Context) {
      if (filter?.(ctx)) {
        throw exception;
      }
      // 在这里可以很方便地拦截处理响应给前台的数据

      const status = (exception as HttpException).status || defaultErrorStatus;
      ctx.response.status = status;
      if (status === 404) {
        if (!isDisableFormat404) {
          if (ctx.response.body === undefined && ctx.response.status === 404) {
            ctx.response.body = options.messageOf404 ??
              await options.get404Body?.(ctx) ?? get404Message();
          }
        } else {
          if (exception instanceof HttpException) {
            ctx.response.body = exception.response;
          }
        }
      } else {
        ctx.response.body = await getErrorBody(exception, ctx);
        if (
          (isIgnoreLog401 && ctx.response.status === 401) ||
          (ignoreResponseLog?.(ctx))
        ) {
          // console.log("this response log be ignored");
        } else {
          logger.error(
            "anyExceptionFilter",
            isLogCompleteError
              ? ((exception as Error).stack || exception)
              : ctx.response.body,
          );
        }
      }
    }
  }

  return AllExceptionsFilter;
};

export function get404Message() {
  return `                
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>not find-404</title>
    <link rel="shortcut icon" href="favicon.ico">
        <style type="text/css">
    
    
        *{
            margin: 0;
            padding: 0;
            list-style: none;
            font-family: 'Noto Sans TC', sans-serif;
    
        }
    
    
    
        .wrap9{
            margin: 220px 30px;
            background-color: #000;
        }
        .container9{
            width: 1300px;
            margin: auto;
            text-align: center;
        }
        .container9 h1{
            width:50%;
            display: inline-block;
            margin-top: 50px;
            box-sizing: border-box;
            font-size: 80px;
            background-color: #a00;
            color: #fff;
            margin-bottom: 0.5em;
            
           
        }
    
        .container9 .txt{
            flex-shrink: 0;
            box-sizing: border-box;
            color: #fff;
        }
        .container9 .txt P{
            display: inline-block;
            margin-bottom: 30px;
            font-size: 26px;
            padding: 0 100px;
        }
        .container9 .txt p:first-child:first-letter{
            font-size: 40px;
        }
    
    
    
        </style>
    </head>
    <body bgcolor="black">
        
        <div class="wrap9">
            <div class="container9">
                <h1>404 WARNING</h1>
                <div class="txt">
                    <p>This is not what you want, but we are very serious. I just want to tell you in a special way that the page you visited does not exist or the file is invalid. You can contact the webmaster to solve your problem faster, or return to the homepage of the website to browse other pages.</p>
                </div>
            </div>
        </div>
    
    </body>
    <!-- partial -->
      
    </body>
    </html>
    `;
}

export type ExceptionOptions = {
  logger?: Logger;
  isDisableFormat404?: boolean;
  isLogCompleteError?: boolean;
  /** if return true, then this request will be ignored */
  filter?: (context: Context) => boolean;
  get404Body?: (context: Context) => string | Promise<string>;
  messageOf404?: string;
  getErrorBody?: (
    err: unknown,
    context: Context,
  ) => string | Promise<string>;
  defaultErrorStatus?: number;
  /** if return true, then this error response log will be ignored */
  ignoreResponseLog?: (context: Context) => boolean;
  /** if true, then 401 response will be ignored to log */
  isIgnoreLog401?: boolean;
};
