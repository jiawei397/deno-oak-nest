import { Body, Controller, Post } from "@nest";
import { AuthService } from "./auth.service.ts";
import { SignInDto } from "./auth.dto.ts";

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
}
