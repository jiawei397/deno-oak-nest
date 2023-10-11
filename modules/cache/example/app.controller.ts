import { Controller, Get, Params, Query, UseInterceptors } from "@nest";
import { CacheInterceptor, CacheTTL, SetCachePolicy } from "@nest/cache";

@Controller("")
@UseInterceptors(CacheInterceptor)
export class AppController {
  @Get("/")
  hello() {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve("hello world");
      }, 500);
    });
  }

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
