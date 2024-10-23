import {
  CanActivate,
  type Context,
  Injectable,
  Reflector,
  type Request,
  UnauthorizedException,
} from "@nest/core";
import { JwtService } from "@nest/jwt";
import { IS_PUBLIC_KEY } from "./auth.decorator.ts";

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private jwtService: JwtService, private reflector: Reflector) {}

  async canActivate(context: Context): Promise<boolean> {
    const isPublic = this.reflector.get<boolean>(IS_PUBLIC_KEY, context);
    console.log(`isPublic:`, isPublic);
    if (isPublic) {
      return true;
    }

    const request = context.request;
    const token = this.extractTokenFromHeader(request);
    if (!token) {
      throw new UnauthorizedException("");
    }
    try {
      const payload = await this.jwtService.verify(token);
      // 💡 We're assigning the payload to the request object here
      // so that we can access it in our route handlers
      request.states.user = payload;
    } catch (e) {
      console.error(`verify token error:`, e);
      throw new UnauthorizedException("");
    }
    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.header("authorization")?.split(" ") ??
      [];
    return type === "Bearer" ? token : undefined;
  }
}
