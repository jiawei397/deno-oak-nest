import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  type Request,
  UseGuards,
} from "@nest";
import { AuthService } from "./auth.service.ts";
import { SignInDto } from "./auth.dto.ts";
import { AuthGuard } from "./auth.guard.ts";

@Controller("/auth")
export class AuthController {
  constructor(private authService: AuthService) {}

  /**
   * login
   * @example
   * ```bash
   * curl -X POST http://localhost:2000/auth/login -d '{"username": "john", "password": "changeme"}' -H "Content-Type: application/json"
   * ```
   */
  @Post("login")
  signIn(@Body() signInDto: SignInDto) {
    return this.authService.signIn(signInDto.username, signInDto.password);
  }

  /**
   * get profile of current user
   * @example
   * ```bash
   * curl http://localhost:2000/auth/profile -H "Authorization: Bearer eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImpvaG4iLCJ1c2VySWQiOjEsImV4cCI6MTcwMTc1ODYxNX0.h2wP32ITBk1sUJA7MBF1lt6iEVHXOlB-A9u-hK5ATPJUtIngAEKf3cFwOIWXV52cy7FkdTigOzLbptrblDZ09Q"
   * ```
   */
  @UseGuards(AuthGuard)
  @Get("profile")
  getProfile(@Req() req: Request) {
    return req.states.user;
  }
}
