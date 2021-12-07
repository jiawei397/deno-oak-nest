// deno-lint-ignore-file require-await
import { CanActivate, Context } from "../../mod.ts";

export class AuthGuard2 implements CanActivate {
  async canActivate(_context: Context): Promise<boolean> {
    console.log("--AuthGuard2---");
    // throw new ForbiddenException('this is AuthGuard2 error message');
    return true;
  }
}
