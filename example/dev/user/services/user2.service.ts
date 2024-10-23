import { Injectable } from "@nest/core";
import { LoggerService } from "./logger.service.ts";
import { RoleService } from "./role.service.ts";

@Injectable()
export class UserService2 {
  constructor(
    readonly roleService: RoleService,
    private readonly loggerService: LoggerService,
  ) {}
  info() {
    this.loggerService.info("----user2 info");
    return "userService2";
  }
}
