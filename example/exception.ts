import { HttpException } from "./deps.ts";
import { Catch, Context, ExceptionFilter } from "../mod.ts";

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, context: Context) {
    // console.log("exception-----", exception);
    context.response.body = {
      statusCode: exception.status,
      timestamp: new Date().toISOString(),
      path: context.request.url,
      type: "HttpExceptionFilter",
    };
  }
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, context: Context) {
    // console.log("AllExceptionsFilter-----", exception);
    context.response.body = {
      statusCode: 500,
      timestamp: new Date().toISOString(),
      path: context.request.url,
      type: "AllExceptionsFilter",
      error: (exception as Error).message,
    };
  }
}
