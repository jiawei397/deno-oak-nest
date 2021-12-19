import { Controller, Get, Query, UseInterceptors } from "../../../mod.ts";
import { CacheInterceptor } from "../mod.ts";

@Controller("")
@UseInterceptors(CacheInterceptor)
export class AppController {
  constructor() {}
  @Get("/delay")
  // @UseInterceptors(CacheInterceptor)
  delay(@Query("id") id: string) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve("delay " + id);
      }, 500);
    });
  }
}
