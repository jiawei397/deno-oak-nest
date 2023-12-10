import {
  BadRequestException,
  Controller,
  Cookie,
  Cookies,
  Get,
  type ICookies,
  Query,
  Req,
  type Request,
  Res,
  type Response,
  UnauthorizedException,
} from "@nest";
import { UserService } from "./user.service.ts";
import { JwtService } from "@nest/jwt";
import config from "../globals.ts";

@Controller("/user")
export class UserController {
  constructor(
    private readonly userService: UserService,
    private jwtService: JwtService,
  ) {
  }

  @Get("login")
  login(@Res() res: Response, @Req() req: Request) {
    const referer = req.headers().get("referer");
    if (!referer) {
      throw new BadRequestException("referer is null");
    }
    const redirect_uri =
      `${config.redirectBaseURL}/api/user/login_callback?beforeURL=${referer}`;
    const location =
      `https://github.com/login/oauth/authorize?client_id=${config.clientId}&redirect_uri=${redirect_uri}`;

    res.headers.set("Location", location);
    res.status = 302;
  }

  @Get("login_callback")
  async login_callback(
    @Query("code") code: string,
    @Query("beforeURL") beforeURL: string,
    @Res() res: Response,
    @Cookies() cookies: ICookies,
  ) {
    if (!code || !beforeURL) {
      throw new BadRequestException("code or beforeURL is null");
    }
    const access_token = await this.userService.get_access_token(code);
    const userinfo = await this.userService.get_user_info(access_token);

    const payload = {
      sub: userinfo.id.toString(),
      name: userinfo.name,
      avatar_url: userinfo.avatar_url,
    };
    const token = await this.jwtService.sign(payload);
    await cookies.set(config.tokenKey, token, {
      httpOnly: true,
      path: "/",
      maxAge: config.jwtExpiration,
      sameSite: "Lax",
      secure: true,
    });
    res.headers.set("Location", beforeURL);
    res.status = 302;
  }

  @Get("/info")
  async userinfo(@Cookie(config.tokenKey) token: string) {
    if (!token) {
      throw new UnauthorizedException("");
    }
    const payload = await this.jwtService.verify(token);
    return payload;
  }
}
