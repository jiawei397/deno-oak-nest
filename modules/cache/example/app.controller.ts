import {
  Controller,
  Get,
  Params,
  Query,
  UseInterceptors,
} from "../../../mod.ts";
import { CacheInterceptor, CacheTTL, SetCachePolicy } from "../mod.ts";

@Controller("")
@UseInterceptors(CacheInterceptor)
export class AppController {
  constructor() {}
  @Get("/delay")
  // @CacheKey("test")
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

  @Get("/cache")
  cache() {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          name: "cache",
          age: 15,
        });
      }, 500);
    });
  }

  @Get("/error")
  error() {
    return new Promise((_resolve, reject) => {
      setTimeout(() => {
        reject("this is my error");
      }, 50);
    });
  }

  @Get("public")
  @SetCachePolicy("private")
  public() {
    return "public";
  }
}
