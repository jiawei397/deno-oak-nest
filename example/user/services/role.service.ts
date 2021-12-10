import { Inject, Injectable } from "../../../mod.ts";

@Injectable()
export class RoleService {
  constructor(@Inject("CONNECTION") private readonly connection: string) {
    console.log("injected connection: ", this.connection, "----", connection);
  }

  info() {
    return "info from RoleService";
  }
}
