import { Controller, Get } from "@nest/core";
import { RolesService } from "./roles/roles.service.ts";

@Controller("")
export class AppController {
  constructor(private readonly rolesService: RolesService) {}

  @Get("/")
  hello() {
    return {
      "roles": this.rolesService.getRole(),
    };
  }
}
