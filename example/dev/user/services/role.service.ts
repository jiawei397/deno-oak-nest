import { assert, Cache, Inject, Injectable } from "@nest";
import { delay } from "../../deps.ts";

@Injectable()
export class RoleService {
  constructor(@Inject("CONNECTION") private readonly connection: string) {
    console.count("RoleService");
    assert(this.connection === "connected", 'connection is not "connected"');
  }

  @Cache(10000)
  async info() {
    await delay(500);
    return "info from RoleService";
  }

  getRole() {
    return { name: "admin" };
  }
}
