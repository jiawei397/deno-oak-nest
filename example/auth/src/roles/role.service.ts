import { assert, Inject, Injectable } from "@nest";
import { RoleAction } from "./role.decorator.ts";
import { User } from "./role.interface.ts";

@Injectable()
export class RoleService {
  constructor(@Inject("CONNECTION") private readonly connection: string) {
    assert(this.connection === "connected", 'connection is not "connected"');
  }

  // deno-lint-ignore require-await
  async getRole(): Promise<User> {
    return {
      userId: 1,
      username: "test",
      actions: [RoleAction.delete, RoleAction.read],
    };
  }
}
