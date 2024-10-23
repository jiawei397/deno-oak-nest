// deno-lint-ignore-file require-await
import { CanActivate, Context } from "@nest/core";

export class PassGuard implements CanActivate {
  async canActivate(_context: Context): Promise<boolean> {
    console.log("pass guard");
    return true;
  }
}
