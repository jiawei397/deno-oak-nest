// deno-lint-ignore-file require-await
import { CanActivate, Context, UnauthorizedException } from "@nest";

export class UnauthorizedGuard implements CanActivate {
  async canActivate(_context: Context): Promise<boolean> {
    console.log("unauthorized guard");
    throw new UnauthorizedException("");
  }
}
