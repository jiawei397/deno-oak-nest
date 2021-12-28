import { Injectable } from "../../../mod.ts";
import { mockjs } from "../../deps.ts";
import { LoggerService } from "./logger.service.ts";
import { RoleService } from "./role.service.ts";
import { UserService2 } from "./user2.service.ts";

@Injectable()
export class UserService {
  constructor(
    private readonly roleService: RoleService,
    private readonly userService2: UserService2,
    private readonly loggerService: LoggerService,
  ) {}
  info() {
    this.loggerService.warn("----user info");
    return mockjs.mock({
      name: "@name",
      "age|1-100": 50,
      "val|0-2": 1,
      role: this.roleService.info(),
      user2: this.userService2.info(),
    });
  }
}
