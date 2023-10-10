import { Context, Injectable, Next } from "../../mod.ts";
import type {
  NestInterceptor,
} from "../../src/interfaces/interceptor.interface.ts";

@Injectable()
export class TransformInterceptor implements NestInterceptor {
  async intercept(context: Context, next: Next) {
    console.info("TransformInterceptor", "Before ...");
    const data = await next();
    console.info("TransformInterceptor", "After ...", data);

    // also can change response data or status code
    context.response.status = 400;
    context.response.body = { data, success: true };
  }
}
