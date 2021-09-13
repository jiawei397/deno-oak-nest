import { Context, Controller, Get } from "../../mod.ts";
import { mockjs } from "../deps.ts";

@Controller("user")
export class User2Controller {
  @Get("/user2")
  info(context: Context) {
    context.response.body = mockjs.mock({
      name: "@name",
      "age|1-100": 50,
      "val|0-2": 1,
    });
  }
}
