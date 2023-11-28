import { assert, Inject, Injectable } from "@nest";
import { ROLE_KEY } from "./roles.constant.ts";

@Injectable()
export class RolesService {
  constructor(
    @Inject(ROLE_KEY) private readonly role: string,
  ) {
    assert(this.role === "admin");
  }

  getRole(): string {
    return this.role;
  }
}
