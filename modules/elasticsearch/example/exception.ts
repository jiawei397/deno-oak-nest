import { Catch, Context, ExceptionFilter } from "@nest";
import { FetchError } from "../deps.ts";

@Catch(FetchError)
export class HttpExceptionsFilter implements ExceptionFilter {
  catch(exception: FetchError, context: Context) {
    console.log("HttpException-----", exception);
    context.response.body = {
      statusCode: exception.status,
      timestamp: new Date().toISOString(),
      path: context.request.url,
      type: "HttpExceptionsFilter",
      error: JSON.parse(exception.message),
    };
  }
}
