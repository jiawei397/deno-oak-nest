import { Injectable } from "../../../mod.ts";
import { RoleService } from "./role.service.ts";

@Injectable()
export class UserService2 {
  constructor(readonly roleService: RoleService) {}
  info() {
    return "userService2";
  }
}
