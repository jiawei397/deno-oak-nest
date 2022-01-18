import {
  Controller,
  Get,
  Params,
  Query,
  UseInterceptors,
} from "../../../mod.ts";
import { CacheInterceptor, CacheTTL } from "../mod.ts";

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

  @Get("/delay/:id")
  @CacheTTL(3000)
  delay2(@Params("id") id: string) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve("delay " + id);
      }, 500);
    });
  }
}
