import { Controller, Get } from "@nest/core";
import { RolesService } from "../roles/roles.service.ts";

@Controller("/users")
export class UsersController {
  constructor(private readonly rolesService: RolesService) {}

  @Get("/")
  hello() {
    return "user: " + this.rolesService.getRole();
  }
}
