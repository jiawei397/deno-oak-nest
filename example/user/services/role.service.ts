import { Cache, Inject, Injectable } from "../../../mod.ts";
import { delay } from "../../deps.ts";

@Injectable()
export class RoleService {
  constructor(@Inject("CONNECTION") private readonly connection: string) {
    // assert(connection === "connected", 'connection is not "connected"');
  }

  @Cache(10000)
  async info() {
    await delay(500);
    return "info from RoleService";
  }
}
