import {
  CanActivate,
  type Context,
  Injectable,
  type Request,
  UnauthorizedException,
} from "@nest";
import { JwtService } from "@nest/jwt";

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: Context): Promise<boolean> {
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
