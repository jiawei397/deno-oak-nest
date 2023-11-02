import {
  BadGatewayException,
  BadRequestException,
  BodyParamValidationException,
  ConflictException,
  ForbiddenException,
  GatewayTimeoutException,
  GoneException,
  HttpException,
  HttpVersionNotSupportedException,
  ImATeapotException,
  InternalServerErrorException,
  MethodNotAllowedException,
  NotAcceptableException,
  NotFoundException,
  NotImplementedException,
  PayloadTooLargeException,
  PreconditionFailedException,
  RequestTimeoutException,
  ServiceUnavailableException,
  UnauthorizedException,
  UnprocessableEntityException,
  UnsupportedMediaTypeException,
} from "./exceptions.ts";
import { assertEquals, describe, it } from "../tests/test_deps.ts";

describe("HttpException", () => {
  describe("constructor", () => {
    it("should set response, status, and cause properties correctly", () => {
      const response = { message: "Error message" };
      const status = 500;
      const cause = new Error("Some cause");

      const exception = new HttpException(response, status, cause);

      assertEquals(exception.response, response);
      assertEquals(exception.status, status);
      assertEquals(exception.cause, cause);
    });
  });

  describe("initMessage", () => {
    it("should set message property to response when it is a string", () => {
      const response = "Error message";
      const exception = new HttpException(response, 500);
      assertEquals(exception.message, response);
    });

    it("should set message property to response.message when response is an object with message property", () => {
      const response = { message: "Error message" };
      const exception = new HttpException(response, 500);
      assertEquals(exception.message, response.message);
    });

    it("should set message property to constructor name when response is not a string or object", () => {
      const exception = new HttpException(null, 500);
      assertEquals(exception.message, "Http Exception");
    });
  });

  describe("createBody", () => {
    it("should return an object with statusCode and message properties when objectOrError is falsy", () => {
      const objectOrError = null;
      const description = "Error description";
      const statusCode = 500;

      const body = HttpException.createBody(
        objectOrError,
        description,
        statusCode,
      );

      assertEquals(body, { statusCode, message: description });
    });

    it("should return objectOrError when it is an object and not an array", () => {
      const objectOrError = { message: "Error message" };
      const description = "Error description";
      const statusCode = 500;

      const body = HttpException.createBody(
        objectOrError,
        description,
        statusCode,
      );
      assertEquals(body, objectOrError);
    });

    it("should return an object with statusCode, message, and error properties when objectOrError is not an object", () => {
      const objectOrError = "Error message";
      const description = "Error description";
      const statusCode = 500;

      const body = HttpException.createBody(
        objectOrError,
        description,
        statusCode,
      );
      assertEquals(body, {
        statusCode,
        message: objectOrError,
        error: description,
      });
    });
  });
});

Deno.test("other exceptions", async (t) => {
  await t.step("BadRequestException", () => {
    const exception = new BadRequestException("error");
    assertEquals(exception.message, "error");
    assertEquals(exception.status, 400);
  });

  await t.step("BodyParamValidationException", () => {
    const exception = new BodyParamValidationException("error");
    assertEquals(exception.message, "error");
    assertEquals(exception.status, 400);
  });

  await t.step("UnauthorizedException", () => {
    const exception = new UnauthorizedException("error");
    assertEquals(exception.message, "error");
    assertEquals(exception.status, 401);
  });

  await t.step("NotFoundException", () => {
    const exception = new NotFoundException("error");
    assertEquals(exception.message, "error");
    assertEquals(exception.status, 404);
  });

  await t.step("ForbiddenException", () => {
    const exception = new ForbiddenException("error");
    assertEquals(exception.message, "error");
    assertEquals(exception.status, 403);
  });

  await t.step("BadGatewayException", () => {
    const exception = new BadGatewayException("error");
    assertEquals(exception.message, "error");
    assertEquals(exception.status, 502);
  });

  await t.step("NotAcceptableException", () => {
    const exception = new NotAcceptableException("error");
    assertEquals(exception.message, "error");
    assertEquals(exception.status, 406);
  });

  await t.step("RequestTimeoutException", () => {
    const exception = new RequestTimeoutException("error");
    assertEquals(exception.message, "error");
    assertEquals(exception.status, 408);
  });

  await t.step("ConflictException", () => {
    const exception = new ConflictException("error");
    assertEquals(exception.message, "error");
    assertEquals(exception.status, 409);
  });

  await t.step("GoneException", () => {
    const exception = new GoneException("error");
    assertEquals(exception.message, "error");
    assertEquals(exception.status, 410);
  });

  await t.step("HttpVersionNotSupportedException", () => {
    const exception = new HttpVersionNotSupportedException("error");
    assertEquals(exception.message, "error");
    assertEquals(exception.status, 505);
  });

  await t.step("PayloadTooLargeException", () => {
    const exception = new PayloadTooLargeException("error");
    assertEquals(exception.message, "error");
    assertEquals(exception.status, 413);
  });

  await t.step("UnsupportedMediaTypeException", () => {
    const exception = new UnsupportedMediaTypeException("error");
    assertEquals(exception.message, "error");
    assertEquals(exception.status, 415);
  });

  await t.step("UnprocessableEntityException", () => {
    const exception = new UnprocessableEntityException("error");
    assertEquals(exception.message, "error");
    assertEquals(exception.status, 422);
  });

  await t.step("InternalServerErrorException", () => {
    const exception = new InternalServerErrorException("error");
    assertEquals(exception.message, "error");
    assertEquals(exception.status, 500);
  });

  await t.step("NotImplementedException", () => {
    const exception = new NotImplementedException("error");
    assertEquals(exception.message, "error");
    assertEquals(exception.status, 501);
  });

  await t.step("ImATeapotException", () => {
    const exception = new ImATeapotException("error");
    assertEquals(exception.message, "error");
    assertEquals(exception.status, 418);
  });

  await t.step("MethodNotAllowedException", () => {
    const exception = new MethodNotAllowedException("error");
    assertEquals(exception.message, "error");
    assertEquals(exception.status, 405);
  });

  await t.step("ServiceUnavailableException", () => {
    const exception = new ServiceUnavailableException("error");
    assertEquals(exception.message, "error");
    assertEquals(exception.status, 503);
  });

  await t.step("GatewayTimeoutException", () => {
    const exception = new GatewayTimeoutException("error");
    assertEquals(exception.message, "error");
    assertEquals(exception.status, 504);
  });

  await t.step("PreconditionFailedException", () => {
    const exception = new PreconditionFailedException("error");
    assertEquals(exception.message, "error");
    assertEquals(exception.status, 412);
  });
});
