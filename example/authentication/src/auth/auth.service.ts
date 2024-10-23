import { Injectable, UnauthorizedException } from "@nest/core";
import { UsersService } from "../users/users.service.ts";
import { JwtService } from "@nest/jwt";

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async signIn(username: string, pass: string) {
    const user = await this.usersService.findOne(username);
    if (user?.password !== pass) {
      throw new UnauthorizedException("");
    }
    const payload = { sub: user.userId.toString(), username: user.username };
    const access_token = await this.jwtService.sign(payload);
    return {
      access_token,
    };
  }
}
