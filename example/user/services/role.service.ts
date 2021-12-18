import { assert, Cache, Inject, Injectable } from "../../../mod.ts";

@Injectable()
export class RoleService {
  constructor(@Inject("CONNECTION") private readonly connection: string) {
    assert(connection === "connected", 'connection is not "connected"');
  }

  @Cache(10000)
  info() {
    return Promise.resolve("info from RoleService");
  }
}
