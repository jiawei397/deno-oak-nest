import { Body, Controller, Get, Post } from "@nest/core";
import type { JwtService } from "@nest/jwt";

@Controller("")
export class AppController {
  constructor(private readonly jwtService: JwtService) {}

  @Get("/")
  async sign() {
    const value = await this.jwtService.sign({ foo: "bar" });
    return {
      value,
    };
  }

  /**
   * verify token, if token is invalid or expired, will throw error
   * @example
   * ```js
   * fetch("http://localhost:2000/verify", {
   *    method: "POST",
   *    headers: {
   *      "Content-Type": "application/json",
   *    },
   *    body: JSON.stringify({
   *      token: "eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJmb28iOiJiYXIiLCJleHAiOjE3MDE3NDcwODR9.7aTW8sz54U_ToUysTyXaOMBXK6PM3uWErNorh2fbBvyCq0nrR3O6MxJrL_FyYGuZhpvjKHaJJXOwjcXaDZyosw"
   *    }),
   * })
   * ```
   */
  @Post("/verify")
  async verify(@Body() body: { token: string }) {
    const payload = await this.jwtService.verify(body.token);
    return {
      payload,
    };
  }
}
