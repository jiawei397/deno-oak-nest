import {
  Controller,
  Get,
  Params,
  Query,
  UseInterceptors,
} from "../../../mod.ts";
import {
  CacheInterceptor,
  CacheKey,
  CacheTTL,
  SetCachePolicy,
} from "../mod.ts";

@Controller("")
@UseInterceptors(CacheInterceptor)
export class AppController {
  constructor() {}
  @Get("/delay")
  @CacheKey("test")
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

  @Get("public")
  @SetCachePolicy("private")
  public() {
    return "public";
  }
}
