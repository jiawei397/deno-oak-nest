import { Controller, Get, UseGuards } from "@nest";
import { RoleAction, Roles, UserInfo } from "../roles/role.decorator.ts";
import { AuthGuard } from "../guards/auth.guard.ts";
import { PassGuard } from "../guards/pass.guard.ts";
import { RoleService } from "../roles/role.service.ts";
import { UnauthorizedGuard } from "../guards/unauthorized.guard.ts";
import { type User } from "../roles/role.interface.ts";

@Controller("/cats")
@UseGuards(AuthGuard)
export class CatsController {
  constructor(private readonly roleService: RoleService) {}

  @Get("/forbidden")
  @Roles(RoleAction.write)
  forbidden() {
    return "hello forbidden";
  }

  @Get("/forbidden2")
  @Roles(RoleAction.read, RoleAction.write)
  forbidden2() {
    return "hello forbidden2";
  }

  @Get("/forbidden3")
  @UseGuards(UnauthorizedGuard)
  forbiddenWithGuard() {
    return "hello forbidden3";
  }

  @Get("/pass")
  @Roles(RoleAction.read)
  pass() {
    return "hello pass";
  }

  @Get("/pass2")
  @Roles(RoleAction.read, RoleAction.delete)
  pass2() {
    return "hello pass2";
  }

  @Get("/pass3")
  passWithoutRoles() {
    return "hello pass3";
  }

  @Get("/pass4")
  @UseGuards(PassGuard)
  passWithGuard() {
    return "hello pass4";
  }

  @Get("/role")
  async getRole() {
    return await this.roleService.getRole();
  }

  @Get("/user")
  getUserInfo(@UserInfo() user: User) {
    return user;
  }
}
