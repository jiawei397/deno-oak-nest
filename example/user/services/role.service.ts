import { assert, Inject, Injectable } from "../../../mod.ts";

@Injectable()
export class RoleService {
  constructor(@Inject("CONNECTION") private readonly connection: string) {
    assert(this.connection === connection);
    assert(connection === "connected", 'connection is not "connected"');
  }

  info() {
    return "info from RoleService";
  }
}
