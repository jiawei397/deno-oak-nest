import { CanActivate, type Context, Injectable } from "@nest";

@Injectable()
export class AuthGuard implements CanActivate {
  // deno-lint-ignore require-await
  async canActivate(context: Context): Promise<boolean> {
    context.request.states.userInfo = {
      id: "123",
      name: "tom",
      age: 18,
    }; // add userInfo to request state, then be used in decorator
    return true;
  }
}
