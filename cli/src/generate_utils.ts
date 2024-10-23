// 首字母大写
function getUpperCaseName(name: string) {
  return name.charAt(0).toUpperCase() + name.slice(1);
}

export function getController(name: string) {
  const controllerName = getUpperCaseName(name) + "Controller";
  return `import { Controller, Get } from "@nest/core";

@Controller("/${name}")
export class ${controllerName} {
  @Get("/")
  hello() {
    return "Hello ${name}!";
  }
}
    `;
}

export function getService(name: string) {
  const serviceName = getUpperCaseName(name) + "Service";
  return `import { Injectable } from "@nest/core";
  
@Injectable()
export class ${serviceName} {}
`;
}

export function getModule(name: string) {
  const moduleName = getUpperCaseName(name) + "Module";
  return `import { Module } from "@nest/core";

@Module({})
export class ${moduleName} {}
`;
}

export function getMiddleware(name: string) {
  const middlewareName = getUpperCaseName(name) + "Middleware";
  return `import { NestMiddleware } from "@nest/core";

export const ${middlewareName}: NestMiddleware = async (req, res, next) => {
  console.log("${middlewareName} before...");
  await next();
  console.log("${middlewareName} after...");
};
  `;
}

export function getGuard(name: string) {
  const guardName = getUpperCaseName(name) + "Guard";
  return `import { CanActivate, type Context, Injectable } from "@nest/core";

@Injectable()
export class ${guardName} implements CanActivate {
  canActivate(context: Context): boolean {
    return true;
  }
}
`;
}

export function getInterceptor(name: string) {
  const interceptorName = getUpperCaseName(name) + "Interceptor";
  return `import { type Context, Injectable, NestInterceptor, Next } from "@nest/core";

@Injectable()
export class ${interceptorName} implements NestInterceptor {
  async intercept(ctx: Context, next: Next) {
    console.log("${interceptorName} before...");
    await next();
    console.log("${interceptorName} after...");
  }
}
  `;
}

export function getExceptionFilter(name: string) {
  const exceptionFilterName = getUpperCaseName(name) + "ExceptionFilter";
  return `import { Catch, type Context, ExceptionFilter, HttpException } from "@nest/core";

@Catch()
export class ${exceptionFilterName}<T> implements ExceptionFilter {
  catch(exception: T, context: Context) {
    context.response.body = {
      statusCode: (exception as HttpException).status || 500,
      message: (exception as HttpException | Error).message || exception,
      timestamp: new Date().toISOString(),
      path: context.request.url,
      type: "${exceptionFilterName}",
    };
  }
}
`;
}

export function getDecorator(name: string) {
  const decoratorName = getUpperCaseName(name);
  return `import { type Context, createParamDecorator } from "@nest/core";

export const ${decoratorName} = createParamDecorator((ctx: Context) => {
  return ctx.request.states.${name};
});
`;
}
