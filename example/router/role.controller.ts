import { Controller, Get } from "../../mod.ts";
import { Context } from "../deps.ts";

@Controller("/role")
export class RoleController {
  @Get("/info")
  test(context: Context) {
    context.response.body = "role info";
  }
}
