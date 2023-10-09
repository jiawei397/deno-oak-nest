import { HttpException } from "./deps.ts";
import { Catch, ExceptionFilter } from "../mod.ts";
import { Context } from "../deps.ts";

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, context: Context) {
    // console.log("exception-----", exception);
    return context.json({
      statusCode: exception.status,
      timestamp: new Date().toISOString(),
      path: context.req.url,
    });
  }
}
