import { Controller, Get } from "@nest";
import { RolesService } from "./roles.service.ts";

@Controller("/roles")
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get("/")
  hello() {
    return "roles: " + this.rolesService.getRole();
  }
}
