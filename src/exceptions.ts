// deno-lint-ignore-file no-explicit-any
import { Status, STATUS_TEXT } from "./deps.ts";

const isString = (fn: any) => typeof fn === "string";
const isObject = (fn: any) => fn && typeof fn === "object";

export class HttpException extends Error {
  public response: any;
  public status: number;

  constructor(response: any, status: number, cause?: unknown) {
    super();
    this.response = response;
    this.status = status;
    this.cause = cause;
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
      // deno-lint-ignore ban-ts-comment
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

// 401
/**
 * Instantiate an `UnauthorizedException` Exception.
 *
 * @example
 * `throw new UnauthorizedException()`
 *
 * @usageNotes
 * The HTTP response status code will be 401.
 * - The `objectOrError` argument defines the JSON response body or the message string.
 * - The `descriptionOrOptions` argument contains either a short description of the HTTP error or an options object used to provide an underlying error cause.
 *
 * By default, the JSON response body contains two properties:
 * - `statusCode`: this will be the value 401.
 * - `message`: the string `'Unauthorized'` by default; override this by supplying
 * a string in the `objectOrError` parameter.
 *
 * If the parameter `objectOrError` is a string, the response body will contain an
 * additional property, `error`, with a short description of the HTTP error. To override the
 * entire JSON response body, pass an object instead. Nest will serialize the object
 * and return it as the JSON response body.
 *
 * @param objectOrError string or object describing the error condition.
 * @param descriptionOrOptions either a short description of the HTTP error or an options object used to provide an underlying error cause
 */
export class UnauthorizedException extends HttpException {
  constructor(
    objectOrError: any,
    description = STATUS_TEXT[Status.Unauthorized],
    cause?: unknown,
  ) {
    super(
      HttpException.createBody(
        objectOrError,
        description!,
        Status.Unauthorized,
      ),
      Status.Unauthorized,
      cause,
    );
  }
}

// 404
/**
 * Instantiate a `NotFoundException` Exception.
 *
 * @example
 * `throw new NotFoundException()`
 *
 * @usageNotes
 * The HTTP response status code will be 404.
 * - The `objectOrError` argument defines the JSON response body or the message string.
 * - The `descriptionOrOptions` argument contains either a short description of the HTTP error or an options object used to provide an underlying error cause.
 *
 * By default, the JSON response body contains two properties:
 * - `statusCode`: this will be the value 404.
 * - `message`: the string `'Not Found'` by default; override this by supplying
 * a string in the `objectOrError` parameter.
 *
 * If the parameter `objectOrError` is a string, the response body will contain an
 * additional property, `error`, with a short description of the HTTP error. To override the
 * entire JSON response body, pass an object instead. Nest will serialize the object
 * and return it as the JSON response body.
 *
 * @param objectOrError string or object describing the error condition.
 * @param descriptionOrOptions either a short description of the HTTP error or an options object used to provide an underlying error cause
 */
export class NotFoundException extends HttpException {
  constructor(
    objectOrError: any,
    description = STATUS_TEXT[Status.NotFound],
    cause?: unknown,
  ) {
    super(
      HttpException.createBody(
        objectOrError,
        description!,
        Status.NotFound,
      ),
      Status.NotFound,
      cause,
    );
  }
}

// 403
/**
 * Instantiate a `ForbiddenException` Exception.
 *
 * @example
 * `throw new ForbiddenException()`
 *
 * @usageNotes
 * The HTTP response status code will be 403.
 * - The `objectOrError` argument defines the JSON response body or the message string.
 * - The `descriptionOrOptions` argument contains either a short description of the HTTP error or an options object used to provide an underlying error cause.
 *
 * By default, the JSON response body contains two properties:
 * - `statusCode`: this will be the value 403.
 * - `message`: the string `'Forbidden'` by default; override this by supplying
 * a string in the `objectOrError` parameter.
 *
 * If the parameter `objectOrError` is a string, the response body will contain an
 * additional property, `error`, with a short description of the HTTP error. To override the
 * entire JSON response body, pass an object instead. Nest will serialize the object
 * and return it as the JSON response body.
 *
 * @param objectOrError string or object describing the error condition.
 * @param descriptionOrOptions either a short description of the HTTP error or an options object used to provide an underlying error cause
 */
export class ForbiddenException extends HttpException {
  constructor(
    objectOrError: any,
    description = STATUS_TEXT[Status.Forbidden],
    cause?: unknown,
  ) {
    super(
      HttpException.createBody(
        objectOrError,
        description!,
        Status.Forbidden,
      ),
      Status.Forbidden,
      cause,
    );
  }
}

// 400
/**
 * Instantiate a `BadRequestException` Exception.
 *
 * @example
 * `throw new BadRequestException()`
 *
 * @usageNotes
 * The HTTP response status code will be 400.
 * - The `objectOrError` argument defines the JSON response body or the message string.
 * - The `descriptionOrOptions` argument contains either a short description of the HTTP error or an options object used to provide an underlying error cause.
 *
 * By default, the JSON response body contains two properties:
 * - `statusCode`: this will be the value 400.
 * - `message`: the string `'Bad Request'` by default; override this by supplying
 * a string in the `objectOrError` parameter.
 *
 * If the parameter `objectOrError` is a string, the response body will contain an
 * additional property, `error`, with a short description of the HTTP error. To override the
 * entire JSON response body, pass an object instead. Nest will serialize the object
 * and return it as the JSON response body.
 *
 * @param objectOrError string or object describing the error condition.
 * @param descriptionOrOptions either a short description of the HTTP error or an options object used to provide an underlying error cause
 */
export class BadRequestException extends HttpException {
  constructor(
    objectOrError: any,
    description = STATUS_TEXT[Status.BadRequest],
    cause?: unknown,
  ) {
    super(
      HttpException.createBody(
        objectOrError,
        description!,
        Status.BadRequest,
      ),
      Status.BadRequest,
      cause,
    );
  }
}

// 400
/**
 * Instantiate a `BodyParamValidationException` Exception.
 *
 * @example
 * `throw new BodyParamValidationException()`
 *
 * @usageNotes
 * The HTTP response status code will be 400.
 * - The `objectOrError` argument defines the JSON response body or the message string.
 * - The `descriptionOrOptions` argument contains either a short description of the HTTP error or an options object used to provide an underlying error cause.
 *
 * By default, the JSON response body contains two properties:
 * - `statusCode`: this will be the value 400.
 * - `message`: the string `'Bad Request'` by default; override this by supplying
 * a string in the `objectOrError` parameter.
 *
 * If the parameter `objectOrError` is a string, the response body will contain an
 * additional property, `error`, with a short description of the HTTP error. To override the
 * entire JSON response body, pass an object instead. Nest will serialize the object
 * and return it as the JSON response body.
 *
 * @param objectOrError string or object describing the error condition.
 * @param descriptionOrOptions either a short description of the HTTP error or an options object used to provide an underlying error cause
 */
export class BodyParamValidationException extends BadRequestException {
  constructor(
    objectOrError: any,
    description = "params not valid",
    cause?: unknown,
  ) {
    super(objectOrError, description, cause);
  }
}

// 502
/**
 * Instantiate a `BadGatewayException` Exception.
 *
 * @example
 * `throw new BadGatewayException()`
 *
 * @usageNotes
 * The HTTP response status code will be 502.
 * - The `objectOrError` argument defines the JSON response body or the message string.
 * - The `descriptionOrOptions` argument contains either a short description of the HTTP error or an options object used to provide an underlying error cause.
 *
 * By default, the JSON response body contains two properties:
 * - `statusCode`: this will be the value 502.
 * - `message`: the string `'Bad Gateway'` by default; override this by supplying
 * a string in the `objectOrError` parameter.
 *
 * If the parameter `objectOrError` is a string, the response body will contain an
 * additional property, `error`, with a short description of the HTTP error. To override the
 * entire JSON response body, pass an object instead. Nest will serialize the object
 * and return it as the JSON response body.
 *
 * @param objectOrError string or object describing the error condition.
 * @param descriptionOrOptions either a short description of the HTTP error or an options object used to provide an underlying error cause
 */
export class BadGatewayException extends HttpException {
  constructor(
    objectOrError: any,
    description = STATUS_TEXT[Status.BadGateway],
    cause?: unknown,
  ) {
    super(
      HttpException.createBody(
        objectOrError,
        description!,
        Status.BadGateway,
      ),
      Status.BadGateway,
      cause,
    );
  }
}

// 406
/**
 * Instantiate a `NotAcceptableException` Exception.
 *
 * @example
 * `throw new NotAcceptableException()`
 *
 * @usageNotes
 * The HTTP response status code will be 406.
 * - The `objectOrError` argument defines the JSON response body or the message string.
 * - The `descriptionOrOptions` argument contains either a short description of the HTTP error or an options object used to provide an underlying error cause.
 *
 * By default, the JSON response body contains two properties:
 * - `statusCode`: this will be the value 406.
 * - `error`: the string `'Not Acceptable'` by default; override this by supplying
 * a string in the `error` parameter.
 *
 * If the parameter `objectOrError` is a string, the response body will contain an
 * additional property, `error`, with a short description of the HTTP error. To override the
 * entire JSON response body, pass an object instead. Nest will serialize the object
 * and return it as the JSON response body.
 *
 * @param objectOrError string or object describing the error condition.
 * @param descriptionOrOptions either a short description of the HTTP error or an options object used to provide an underlying error cause
 */
export class NotAcceptableException extends HttpException {
  constructor(
    objectOrError: any,
    description = STATUS_TEXT[Status.NotAcceptable],
    cause?: unknown,
  ) {
    super(
      HttpException.createBody(
        objectOrError,
        description!,
        Status.NotAcceptable,
      ),
      Status.NotAcceptable,
      cause,
    );
  }
}

/**
 * Instantiate a `RequestTimeoutException` Exception.
 *
 * @example
 * `throw new RequestTimeoutException()`
 *
 * @usageNotes
 * The HTTP response status code will be 408.
 * - The `objectOrError` argument defines the JSON response body or the message string.
 * - The `descriptionOrOptions` argument contains either a short description of the HTTP error or an options object used to provide an underlying error cause.
 *
 * By default, the JSON response body contains two properties:
 * - `statusCode`: this will be the value 408.
 * - `message`: the string `'Request Timeout'` by default; override this by supplying
 * a string in the `objectOrError` parameter.
 *
 * If the parameter `objectOrError` is a string, the response body will contain an
 * additional property, `error`, with a short description of the HTTP error. To override the
 * entire JSON response body, pass an object instead. Nest will serialize the object
 * and return it as the JSON response body.
 *
 * @param objectOrError string or object describing the error condition.
 * @param descriptionOrOptions either a short description of the HTTP error or an options object used to provide an underlying error cause
 */
export class RequestTimeoutException extends HttpException {
  constructor(
    objectOrError: any,
    description = STATUS_TEXT[Status.RequestTimeout],
    cause?: unknown,
  ) {
    super(
      HttpException.createBody(
        objectOrError,
        description!,
        Status.RequestTimeout,
      ),
      Status.RequestTimeout,
      cause,
    );
  }
}

/**
 * Instantiate a `ConflictException` Exception.
 *
 * @example
 * `throw new ConflictException()`
 *
 * @usageNotes
 * The HTTP response status code will be 409.
 * - The `objectOrError` argument defines the JSON response body or the message string.
 * - The `descriptionOrOptions` argument contains either a short description of the HTTP error or an options object used to provide an underlying error cause.
 *
 * By default, the JSON response body contains two properties:
 * - `statusCode`: this will be the value 409.
 * - `message`: the string `'Conflict'` by default; override this by supplying
 * a string in the `objectOrError` parameter.
 *
 * If the parameter `objectOrError` is a string, the response body will contain an
 * additional property, `error`, with a short description of the HTTP error. To override the
 * entire JSON response body, pass an object instead. Nest will serialize the object
 * and return it as the JSON response body.
 *
 * @param objectOrError string or object describing the error condition.
 * @param descriptionOrOptions either a short description of the HTTP error or an options object used to provide an underlying error cause
 */
export class ConflictException extends HttpException {
  constructor(
    objectOrError: any,
    description = STATUS_TEXT[Status.Conflict],
    cause?: unknown,
  ) {
    super(
      HttpException.createBody(
        objectOrError,
        description!,
        Status.Conflict,
      ),
      Status.Conflict,
      cause,
    );
  }
}

/**
 * Instantiate a `GoneException` Exception.
 *
 * @example
 * `throw new GoneException()`
 *
 * @usageNotes
 * The HTTP response status code will be 410.
 * - The `objectOrError` argument defines the JSON response body or the message string.
 * - The `descriptionOrOptions` argument contains either a short description of the HTTP error or an options object used to provide an underlying error cause.
 *
 * By default, the JSON response body contains two properties:
 * - `statusCode`: this will be the value 410.
 * - `message`: the string `'Gone'` by default; override this by supplying
 * a string in the `objectOrError` parameter.
 *
 * If the parameter `objectOrError` is a string, the response body will contain an
 * additional property, `error`, with a short description of the HTTP error. To override the
 * entire JSON response body, pass an object instead. Nest will serialize the object
 * and return it as the JSON response body.
 *
 * @param objectOrError string or object describing the error condition.
 * @param descriptionOrOptions either a short description of the HTTP error or an options object used to provide an underlying error cause
 */
export class GoneException extends HttpException {
  constructor(
    objectOrError: any,
    description = STATUS_TEXT[Status.Gone],
    cause?: unknown,
  ) {
    super(
      HttpException.createBody(
        objectOrError,
        description!,
        Status.Gone,
      ),
      Status.Gone,
      cause,
    );
  }
}

/**
 * Instantiate a `HttpVersionNotSupportedException` Exception.
 *
 * @example
 * `throw new HttpVersionNotSupportedException()`
 *
 * @usageNotes
 * The HTTP response status code will be 505.
 * - The `objectOrError` argument defines the JSON response body or the message string.
 * - The `descriptionOrOptions` argument contains either a short description of the HTTP error or an options object used to provide an underlying error cause.
 *
 * By default, the JSON response body contains two properties:
 * - `statusCode`: this will be the value 505.
 * - `message`: the string `'HTTP Version Not Supported'` by default; override this by supplying
 * a string in the `objectOrError` parameter.
 *
 * If the parameter `objectOrError` is a string, the response body will contain an
 * additional property, `error`, with a short description of the HTTP error. To override the
 * entire JSON response body, pass an object instead. Nest will serialize the object
 * and return it as the JSON response body.
 *
 * @param objectOrError string or object describing the error condition.
 * @param descriptionOrOptions either a short description of the HTTP error or an options object used to provide an underlying error cause
 */
export class HttpVersionNotSupportedException extends HttpException {
  constructor(
    objectOrError: any,
    description = STATUS_TEXT[Status.HTTPVersionNotSupported],
    cause?: unknown,
  ) {
    super(
      HttpException.createBody(
        objectOrError,
        description!,
        Status.HTTPVersionNotSupported,
      ),
      Status.HTTPVersionNotSupported,
      cause,
    );
  }
}

/**
 * Instantiate a `PayloadTooLargeException` Exception.
 *
 * @example
 * `throw new PayloadTooLargeException()`
 *
 * @usageNotes
 * The HTTP response status code will be 413.
 * - The `objectOrError` argument defines the JSON response body or the message string.
 * - The `descriptionOrOptions` argument contains either a short description of the HTTP error or an options object used to provide an underlying error cause.
 *
 * By default, the JSON response body contains two properties:
 * - `statusCode`: this will be the value 413.
 * - `message`: the string `'Payload Too Large'` by default; override this by supplying
 * a string in the `objectOrError` parameter.
 *
 * If the parameter `objectOrError` is a string, the response body will contain an
 * additional property, `error`, with a short description of the HTTP error. To override the
 * entire JSON response body, pass an object instead. Nest will serialize the object
 * and return it as the JSON response body.
 *
 * @param objectOrError string or object describing the error condition.
 * @param descriptionOrOptions either a short description of the HTTP error or an options object used to provide an underlying error cause
 */
export class PayloadTooLargeException extends HttpException {
  constructor(
    objectOrError: any,
    description = STATUS_TEXT[Status.RequestEntityTooLarge],
    cause?: unknown,
  ) {
    super(
      HttpException.createBody(
        objectOrError,
        description!,
        Status.RequestEntityTooLarge,
      ),
      Status.RequestEntityTooLarge,
      cause,
    );
  }
}

/**
 * Instantiate an `UnsupportedMediaTypeException` Exception.
 *
 * @example
 * `throw new UnsupportedMediaTypeException()`
 *
 * @usageNotes
 * The HTTP response status code will be 415.
 * - The `objectOrError` argument defines the JSON response body or the message string.
 * - The `descriptionOrOptions` argument contains either a short description of the HTTP error or an options object used to provide an underlying error cause.
 *
 * By default, the JSON response body contains two properties:
 * - `statusCode`: this will be the value 415.
 * - `message`: the string `'Unsupported Media Type'` by default; override this by supplying
 * a string in the `objectOrError` parameter.
 *
 * If the parameter `objectOrError` is a string, the response body will contain an
 * additional property, `error`, with a short description of the HTTP error. To override the
 * entire JSON response body, pass an object instead. Nest will serialize the object
 * and return it as the JSON response body.
 *
 * @param objectOrError string or object describing the error condition.
 * @param descriptionOrOptions either a short description of the HTTP error or an options object used to provide an underlying error cause
 */
export class UnsupportedMediaTypeException extends HttpException {
  constructor(
    objectOrError: any,
    description = STATUS_TEXT[Status.UnsupportedMediaType],
    cause?: unknown,
  ) {
    super(
      HttpException.createBody(
        objectOrError,
        description!,
        Status.UnsupportedMediaType,
      ),
      Status.UnsupportedMediaType,
      cause,
    );
  }
}

/**
 * Instantiate an `UnprocessableEntityException` Exception.
 *
 * @example
 * `throw new UnprocessableEntityException()`
 *
 * @usageNotes
 * The HTTP response status code will be 422.
 * - The `objectOrError` argument defines the JSON response body or the message string.
 * - The `descriptionOrOptions` argument contains either a short description of the HTTP error or an options object used to provide an underlying error cause.
 *
 * By default, the JSON response body contains two properties:
 * - `statusCode`: this will be the value 422.
 * - `message`: the string `'Unprocessable Entity'` by default; override this by supplying
 * a string in the `objectOrError` parameter.
 *
 * If the parameter `objectOrError` is a string, the response body will contain an
 * additional property, `error`, with a short description of the HTTP error. To override the
 * entire JSON response body, pass an object instead. Nest will serialize the object
 * and return it as the JSON response body.
 *
 * @param objectOrError string or object describing the error condition.
 * @param descriptionOrOptions either a short description of the HTTP error or an options object used to provide an underlying error cause
 */
export class UnprocessableEntityException extends HttpException {
  constructor(
    objectOrError: any,
    description = STATUS_TEXT[Status.UnprocessableEntity],
    cause?: unknown,
  ) {
    super(
      HttpException.createBody(
        objectOrError,
        description!,
        Status.UnprocessableEntity,
      ),
      Status.UnprocessableEntity,
      cause,
    );
  }
}

// 500
/**
 * Instantiate an `InternalServerErrorException` Exception.
 *
 * @example
 * `throw new InternalServerErrorException()`
 *
 * @usageNotes
 * The HTTP response status code will be 500.
 * - The `objectOrError` argument defines the JSON response body or the message string.
 * - The `descriptionOrOptions` argument contains either a short description of the HTTP error or an options object used to provide an underlying error cause.
 *
 * By default, the JSON response body contains two properties:
 * - `statusCode`: this will be the value 500.
 * - `message`: the string `'Internal Server Error'` by default; override this by supplying
 * a string in the `objectOrError` parameter.
 *
 * If the parameter `objectOrError` is a string, the response body will contain an
 * additional property, `error`, with a short description of the HTTP error. To override the
 * entire JSON response body, pass an object instead. Nest will serialize the object
 * and return it as the JSON response body.
 *
 * @param objectOrError string or object describing the error condition.
 * @param descriptionOrOptions either a short description of the HTTP error or an options object used to provide an underlying error cause
 */
export class InternalServerErrorException extends HttpException {
  constructor(
    objectOrError: any,
    description = STATUS_TEXT[Status.InternalServerError],
    cause?: unknown,
  ) {
    super(
      HttpException.createBody(
        objectOrError,
        description!,
        Status.InternalServerError,
      ),
      Status.InternalServerError,
      cause,
    );
  }
}

// 501
/**
 * Instantiate a `NotImplementedException` Exception.
 *
 * @example
 * `throw new NotImplementedException()`
 *
 * @usageNotes
 * The HTTP response status code will be 501.
 * - The `objectOrError` argument defines the JSON response body or the message string.
 * - The `descriptionOrOptions` argument contains either a short description of the HTTP error or an options object used to provide an underlying error cause.
 *
 * By default, the JSON response body contains two properties:
 * - `statusCode`: this will be the value 501.
 * - `message`: the string `'Not Implemented'` by default; override this by supplying
 * a string in the `objectOrError` parameter.
 *
 * If the parameter `objectOrError` is a string, the response body will contain an
 * additional property, `error`, with a short description of the HTTP error. To override the
 * entire JSON response body, pass an object instead. Nest will serialize the object
 * and return it as the JSON response body.
 *
 * @param descriptionOrOptions either a short description of the HTTP error or an options object used to provide an underlying error cause
 * @param error a short description of the HTTP error.
 */
export class NotImplementedException extends HttpException {
  constructor(
    objectOrError: any,
    description = STATUS_TEXT[Status.NotImplemented],
    cause?: unknown,
  ) {
    super(
      HttpException.createBody(
        objectOrError,
        description!,
        Status.NotImplemented,
      ),
      Status.NotImplemented,
      cause,
    );
  }
}

/**
 * Instantiate an `ImATeapotException` Exception.
 *
 * @example
 * `throw new ImATeapotException()`
 *
 * @usageNotes
 * The HTTP response status code will be 418.
 * - The `objectOrError` argument defines the JSON response body or the message string.
 * - The `descriptionOrOptions` argument contains either a short description of the HTTP error or an options object used to provide an underlying error cause.
 *
 * By default, the JSON response body contains two properties:
 * - `statusCode`: this will be the value 418.
 * - `message`: the string `"I'm a Teapot"` by default; override this by supplying
 * a string in the `objectOrError` parameter.
 *
 * If the parameter `objectOrError` is a string, the response body will contain an
 * additional property, `error`, with a short description of the HTTP error. To override the
 * entire JSON response body, pass an object instead. Nest will serialize the object
 * and return it as the JSON response body.
 *
 * @param objectOrError string or object describing the error condition.
 * @param descriptionOrOptions either a short description of the HTTP error or an options object used to provide an underlying error cause
 */
export class ImATeapotException extends HttpException {
  constructor(
    objectOrError: any,
    description = STATUS_TEXT[Status.Teapot],
    cause?: unknown,
  ) {
    super(
      HttpException.createBody(
        objectOrError,
        description!,
        Status.Teapot,
      ),
      Status.Teapot,
      cause,
    );
  }
}

// 405
/**
 * Instantiate a `MethodNotAllowedException` Exception.
 *
 * @example
 * `throw new MethodNotAllowedException()`
 *
 * @usageNotes
 * The HTTP response status code will be 405.
 * - The `objectOrError` argument defines the JSON response body or the message string.
 * - The `descriptionOrOptions` argument contains either a short description of the HTTP error or an options object used to provide an underlying error cause.
 *
 * By default, the JSON response body contains two properties:
 * - `statusCode`: this will be the value 405.
 * - `message`: the string `'Method Not Allowed'` by default; override this by supplying
 * a string in the `objectOrError` parameter.
 *
 * If the parameter `objectOrError` is a string, the response body will contain an
 * additional property, `error`, with a short description of the HTTP error. To override the
 * entire JSON response body, pass an object instead. Nest will serialize the object
 * and return it as the JSON response body.
 *
 * @param objectOrError string or object describing the error condition.
 * @param descriptionOrOptions either a short description of the HTTP error or an options object used to provide an underlying error cause
 */
export class MethodNotAllowedException extends HttpException {
  constructor(
    objectOrError: any,
    description = STATUS_TEXT[Status.MethodNotAllowed],
    cause?: unknown,
  ) {
    super(
      HttpException.createBody(
        objectOrError,
        description!,
        Status.MethodNotAllowed,
      ),
      Status.MethodNotAllowed,
      cause,
    );
  }
}

// 503
/**
 * Instantiate a `ServiceUnavailableException` Exception.
 *
 * @example
 * `throw new ServiceUnavailableException()`
 *
 * @usageNotes
 * The HTTP response status code will be 503.
 * - The `objectOrError` argument defines the JSON response body or the message string.
 * - The `descriptionOrOptions` argument contains either a short description of the HTTP error or an options object used to provide an underlying error cause.
 *
 * By default, the JSON response body contains two properties:
 * - `statusCode`: this will be the value 503.
 * - `message`: the string `'Service Unavailable'` by default; override this by supplying
 * a string in the `objectOrError` parameter.
 *
 * If the parameter `objectOrError` is a string, the response body will contain an
 * additional property, `error`, with a short description of the HTTP error. To override the
 * entire JSON response body, pass an object instead. Nest will serialize the object
 * and return it as the JSON response body.
 *
 * @param objectOrError string or object describing the error condition.
 * @param descriptionOrOptions either a short description of the HTTP error or an options object used to provide an underlying error cause
 */
export class ServiceUnavailableException extends HttpException {
  constructor(
    objectOrError: any,
    description = STATUS_TEXT[Status.ServiceUnavailable],
    cause?: unknown,
  ) {
    super(
      HttpException.createBody(
        objectOrError,
        description!,
        Status.ServiceUnavailable,
      ),
      Status.ServiceUnavailable,
      cause,
    );
  }
}

// 504
/**
 * Instantiate a `GatewayTimeoutException` Exception.
 *
 * @example
 * `throw new GatewayTimeoutException()`
 *
 * @usageNotes
 * The HTTP response status code will be 504.
 * - The `objectOrError` argument defines the JSON response body or the message string.
 * - The `descriptionOrOptions` argument contains either a short description of the HTTP error or an options object used to provide an underlying error cause.
 *
 * By default, the JSON response body contains two properties:
 * - `statusCode`: this will be the value 504.
 * - `message`: the string `'Gateway Timeout'` by default; override this by supplying
 * a string in the `objectOrError` parameter.
 *
 * If the parameter `objectOrError` is a string, the response body will contain an
 * additional property, `error`, with a short description of the HTTP error. To override the
 * entire JSON response body, pass an object instead. Nest will serialize the object
 * and return it as the JSON response body.
 *
 * @param objectOrError string or object describing the error condition.
 * @param descriptionOrOptions either a short description of the HTTP error or an options object used to provide an underlying error cause
 */
export class GatewayTimeoutException extends HttpException {
  constructor(
    objectOrError: any,
    description = STATUS_TEXT[Status.GatewayTimeout],
    cause?: unknown,
  ) {
    super(
      HttpException.createBody(
        objectOrError,
        description!,
        Status.GatewayTimeout,
      ),
      Status.GatewayTimeout,
      cause,
    );
  }
}

// 412
/**
 * Instantiate a `PreconditionFailedException` Exception.
 *
 * @example
 * `throw new PreconditionFailedException()`
 *
 * @usageNotes
 * The HTTP response status code will be 412.
 * - The `objectOrError` argument defines the JSON response body or the message string.
 * - The `descriptionOrOptions` argument contains either a short description of the HTTP error or an options object used to provide an underlying error cause.
 *
 * By default, the JSON response body contains two properties:
 * - `statusCode`: this will be the value 412.
 * - `message`: the string `'Precondition Failed'` by default; override this by supplying
 * a string in the `objectOrError` parameter.
 *
 * If the parameter `objectOrError` is a string, the response body will contain an
 * additional property, `error`, with a short description of the HTTP error. To override the
 * entire JSON response body, pass an object instead. Nest will serialize the object
 * and return it as the JSON response body.
 *
 * @param objectOrError string or object describing the error condition.
 * @param descriptionOrOptions either a short description of the HTTP error or an options object used to provide an underlying error cause
 */
export class PreconditionFailedException extends HttpException {
  constructor(
    objectOrError: any,
    description = STATUS_TEXT[Status.PreconditionFailed],
    cause?: unknown,
  ) {
    super(
      HttpException.createBody(
        objectOrError,
        description!,
        Status.PreconditionFailed,
      ),
      Status.PreconditionFailed,
      cause,
    );
  }
}
