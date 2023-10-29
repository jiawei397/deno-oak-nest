// deno-lint-ignore-file no-explicit-any
import { vary } from "../deps.ts";
import { CORSHeader, CORSHeaders, CorsOptions } from "./types.ts";
import type {
  Request,
  Response,
} from "../../../src/interfaces/context.interface.ts";
import {
  NestMiddleware,
  Next,
} from "../../../src/interfaces/middleware.interface.ts";

export const defaults: CorsOptions = {
  origin: true, // "*",
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  preflightContinue: false,
  optionsSuccessStatus: 204,
};

function isString(s: unknown) {
  return typeof s === "string" || s instanceof String;
}

function isOriginAllowed(origin: any, allowedOrigin: any) {
  if (Array.isArray(allowedOrigin)) {
    for (let i = 0; i < allowedOrigin.length; ++i) {
      if (isOriginAllowed(origin, allowedOrigin[i])) {
        return true;
      }
    }
    return false;
  } else if (isString(allowedOrigin)) {
    return origin === allowedOrigin;
  } else if (allowedOrigin instanceof RegExp) {
    return allowedOrigin.test(origin);
  } else {
    return !!allowedOrigin;
  }
}

function configureOrigin(options: CorsOptions, req: Request) {
  const requestOrigin = req.header("origin");
  const headers: CORSHeader[] = [];
  let isAllowed: boolean;

  if (!options.origin || options.origin === "*") {
    // allow any origin
    headers.push({
      key: "Access-Control-Allow-Origin",
      value: "*",
    });
  } else if (isString(options.origin)) {
    // fixed origin
    headers.push({
      key: "Access-Control-Allow-Origin",
      value: options.origin,
    });
    headers.push({
      key: "Vary",
      value: "Origin",
    });
  } else {
    isAllowed = isOriginAllowed(requestOrigin, options.origin);
    headers.push({
      key: "Access-Control-Allow-Origin",
      value: isAllowed ? requestOrigin : false,
    });
    headers.push({
      key: "Vary",
      value: "Origin",
    });
  }

  return headers;
}

function configureMethods(options: CorsOptions) {
  let methods = options.methods;
  if (Array.isArray(methods)) {
    methods = methods.join(","); // .methods is an array, so turn it into a string
  }
  return {
    key: "Access-Control-Allow-Methods",
    value: methods,
  };
}

function configureCredentials(options: CorsOptions) {
  if (options.credentials === true) {
    return {
      key: "Access-Control-Allow-Credentials",
      value: "true",
    };
  }
  return null;
}

function configureAllowedHeaders(options: CorsOptions, req: Request) {
  let allowedHeaders = options.allowedHeaders;
  const headers = [];

  if (!allowedHeaders) {
    allowedHeaders = req.header("access-control-request-headers") ||
      undefined; // .headers wasn't specified, so reflect the request headers
    headers.push([{
      key: "Vary",
      value: "Access-Control-Request-Headers",
    }]);
    return headers;
  }
  if (Array.isArray(allowedHeaders)) {
    allowedHeaders = allowedHeaders.join(","); // .headers is an array, so turn it into a string
  }
  if (allowedHeaders) {
    headers.push([{
      key: "Access-Control-Allow-Headers",
      value: allowedHeaders,
    }]);
  }

  return headers;
}

function configureExposedHeaders(options: CorsOptions) {
  let headers = options.exposedHeaders;
  if (!headers) {
    return null;
  }
  if (Array.isArray(headers)) {
    headers = headers.join(","); // .headers is an array, so turn it into a string
  }
  if (headers.length) {
    return {
      key: "Access-Control-Expose-Headers",
      value: headers,
    };
  }
  return null;
}

function configureMaxAge(options: CorsOptions) {
  const maxAge = options.maxAge && options.maxAge.toString();
  if (maxAge && maxAge.length) {
    return {
      key: "Access-Control-Max-Age",
      value: maxAge,
    };
  }
  return null;
}

function applyHeaders(headers: CORSHeaders, res: Response) {
  for (let i = 0, n = headers.length; i < n; i++) {
    const header = headers[i];
    if (header) {
      if (Array.isArray(header)) {
        applyHeaders(header, res);
      } else if (header.key === "Vary" && header.value) {
        vary(res.headers, header.value);
      } else if (header.value) {
        res.headers.set(header.key, header.value);
      }
    }
  }
}

async function cors(
  options: CorsOptions,
  req: Request,
  res: Response,
  next: Next,
) {
  const headers: CORSHeaders = [];
  const method = req.method.toUpperCase();

  if (method === "OPTIONS") {
    // preflight
    headers.push(configureOrigin(options, req));
    headers.push(configureCredentials(options));
    headers.push(configureMethods(options));
    headers.push(...configureAllowedHeaders(options, req));
    headers.push(configureMaxAge(options));
    headers.push(configureExposedHeaders(options));
    applyHeaders(headers, res);

    if (options.preflightContinue) {
      await next();
    } else {
      // Safari (and potentially other browsers) need content-length 0,
      //   for 204 or they just hang waiting for a body
      if (options.optionsSuccessStatus) {
        res.status = options.optionsSuccessStatus;
        res.headers.set("Content-Length", "0");
      }
      await next(); //TODO Not sure
    }
  } else {
    // actual response
    headers.push(configureOrigin(options, req));
    headers.push(configureCredentials(options));
    headers.push(configureExposedHeaders(options));
    applyHeaders(headers, res);
    await next();
  }
}

export function CORS(options?: boolean | CorsOptions) {
  const middleware: NestMiddleware = async function (request, response, next) {
    if (options === false) { // not need cors
      return next();
    }
    const corsOptions: CorsOptions = Object.assign({}, defaults, options);
    if (!options || options === true) {
      corsOptions.origin = true;
      corsOptions.credentials = true;
    } else if (typeof options?.origin === "function") {
      const origin = options.origin(request.header("origin")!);
      if (!origin) {
        return next();
      }
      corsOptions.origin = origin;
    }
    await cors(corsOptions, request, response, next);
  };
  return middleware;
}
