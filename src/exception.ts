import { Status } from "../deps.ts";

const isString = (fn: any) => typeof fn === "string";
const isObject = (fn: any) => fn && typeof fn === "object";

export class HttpException extends Error {
  private response: any;
  public status: number;

  constructor(response: any, status: number) {
    super();
    this.response = response;
    this.status = status;
    this.initMessage();
  }
  initMessage() {
    if (isString(this.response)) {
      this.message = this.response;
    } else if (
      isObject(this.response) &&
      isString(this.response.message)
    ) {
      this.message = this.response.message;
    } else if (this.constructor) {
      // @ts-ignore
      this.message = this.constructor.name
        .match(/[A-Z][a-z]+|[0-9]+/g)
        .join(" ");
    }
  }
  static createBody(
    objectOrError: any,
    description: string,
    statusCode: number,
  ) {
    if (!objectOrError) {
      return { statusCode, message: description };
    }
    return isObject(objectOrError) && !Array.isArray(objectOrError)
      ? objectOrError
      : { statusCode, message: objectOrError, error: description };
  }
}

export class UnauthorizedException extends HttpException {
  constructor(objectOrError: any, description = "Unauthorized") {
    super(
      HttpException.createBody(
        objectOrError,
        description,
        Status.Unauthorized,
      ),
      Status.Unauthorized,
    );
  }
}

export class ForbiddenException extends HttpException {
  constructor(objectOrError: any, description = "Forbidden") {
    super(
      HttpException.createBody(
        objectOrError,
        description,
        Status.Forbidden,
      ),
      Status.Forbidden,
    );
  }
}
