import {
  Controller,
  Cookie,
  Cookies,
  Get,
  type ICookies,
  Req,
  type Request,
  Res,
  type Response,
} from "@nest/core";

@Controller("")
export class AppController {
  @Get("/req")
  req(@Req() req: Request) {
    return req.cookies.getAll();
  }

  @Get("/res")
  res(@Res() res: Response) {
    res.cookies.set("DENO_COOKIE_TEST", "abc", { path: "/" });
    return "ok";
  }

  @Get("/")
  getAllCookies(@Cookies() cookies: ICookies) {
    return cookies.getAll();
  }

  @Get("/setTest")
  async setCookie(@Cookies() cookies: ICookies) {
    await cookies.set("DENO_COOKIE_TEST", "abc", {
      path: "/",
      // signed: false,
    });
    return "ok";
  }

  @Get("/test")
  getTest(@Cookie("DENO_COOKIE_TEST") test: string) {
    return {
      DENO_COOKIE_TEST: test,
    };
  }

  @Get("/signedTest")
  signedTest(
    @Cookie("DENO_COOKIE_TEST", {
      signed: true,
    }) test: string,
  ) {
    return {
      DENO_COOKIE_TEST: test, // to be `false`
    };
  }

  @Get("/setSignedId")
  async setSignedCookie(@Cookies() cookies: ICookies) {
    await cookies.set("DENO_COOKIE_USER_ID", "123", {
      path: "/",
      signed: true,
      signedSecret: "abcdefg",
    });
    return "ok";
  }

  @Get("/id")
  getId(@Cookie("DENO_COOKIE_USER_ID") id: string) {
    return {
      DENO_COOKIE_USER_ID: id,
    };
  }

  @Get("/signedId")
  getSignedId(
    @Cookie("DENO_COOKIE_USER_ID", {
      signed: true,
      signedSecret: "abcdefg",
    }) id: number,
  ) {
    return {
      DENO_COOKIE_USER_ID: id,
    };
  }
}
