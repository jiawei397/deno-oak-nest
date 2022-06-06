// deno-lint-ignore-file no-explicit-any
import {
  blue,
  format,
  green,
  OriginRouter,
  red,
  Reflect,
  Status,
  STATUS_TEXT,
  yellow,
} from "../deps.ts";
import { checkByGuard } from "./guard.ts";
import {
  Constructor,
  ControllerMethod,
  NestUseInterceptors,
  RouteItem,
  RouteMap,
  Type,
} from "./interfaces/mod.ts";
import {
  META_ALIAS_KEY,
  META_HEADER_KEY,
  META_HTTP_CODE_KEY,
  META_METHOD_KEY,
  META_PATH_KEY,
} from "./decorators/controller.ts";
import { Factory } from "./factorys/class.factory.ts";
import { transferParam } from "./params.ts";
import { Context } from "../deps.ts";
import { checkByInterceptors } from "./interceptor.ts";
import { checkEtag } from "./utils.ts";
import { AliasOptions } from "./interfaces/controller.interface.ts";

export function join(...paths: string[]) {
  if (paths.length === 0) {
    return "";
  }
  const str = paths.join("/").replaceAll("///", "/").replaceAll("//", "/");
  let last = str;
  if (!last.startsWith("/")) {
    last = "/" + last;
  }
  if (last.endsWith("/")) {
    last = last.substring(0, last.length - 1);
  }
  return last;
}

export function replacePrefix(str: string, prefix: string) {
  return join(str.replace(/\$\{prefix\}/, prefix));
}

export function replaceSuffix(str: string, suffix: string) {
  return join(str.replace(/\$\{suffix\}/, suffix));
}

export function replaceController(str: string, suffix: string) {
  return join(str.replace(/\$\{controller\}/, suffix));
}

export function replacePrefixAndSuffix(
  str: string,
  prefix: string,
  suffix: string,
  controller?: string,
) {
  let temp = replacePrefix(str, prefix);
  if (controller) {
    temp = replaceController(temp, controller);
  }
  temp = replaceSuffix(temp, suffix);
  return temp;
}

export async function mapRoute(Cls: Type): Promise<RouteMap[]> {
  const instance = await Factory(Cls);
  const prototype = Cls.prototype;
  const result: RouteMap[] = [];
  Object.getOwnPropertyNames(prototype)
    .forEach((item) => {
      if (item === "constructor") {
        return;
      }
      if (typeof prototype[item] !== "function") {
        return;
      }
      const fn = prototype[item];
      const methodPath = Reflect.getMetadata(META_PATH_KEY, fn);
      if (!methodPath) {
        return;
      }
      const methodType = Reflect.getMetadata(META_METHOD_KEY, fn);
      const aliasOptions: AliasOptions = Reflect.getMetadata(
        META_ALIAS_KEY,
        fn,
      );
      result.push({
        methodPath,
        aliasOptions,
        methodType: methodType.toLowerCase(),
        fn,
        instance,
        cls: Cls,
        methodName: item,
      });
    });
  return result;
}

type ApiPrefixOptions = {
  /**
   * The controller path will check by exclude regExp
   * @example
   * ["^/?v\\d{1,3}/", /^\/?v\d{1,3}\//]
   */
  exclude?: (string | RegExp)[];
};

export class Router extends OriginRouter {
  [x: string]: any
  apiPrefix = "";
  apiPrefixOptions: ApiPrefixOptions = {};
  private _diabledGetComputeEtag = false;
  private routerArr: RouteItem[] = [];

  private globalInterceptors: NestUseInterceptors = [];

  setGlobalPrefix(apiPrefix: string, options: ApiPrefixOptions = {}) {
    this.apiPrefix = apiPrefix;
    this.apiPrefixOptions = options;
  }

  /** diable 304 get */
  disableGetComputeEtag() {
    this._diabledGetComputeEtag = true;
  }

  useGlobalInterceptors(...interceptors: NestUseInterceptors) {
    this.globalInterceptors.push(...interceptors);
  }

  async add(...clsArr: Type[]) {
    await Promise.all(clsArr.map(async (Cls) => {
      const find = this.routerArr.find(({ cls }) => cls === Cls);
      if (find) {
        return;
      }
      const arr = await mapRoute(Cls);
      const path = Reflect.getMetadata(META_PATH_KEY, Cls);
      const aliasOptions = Reflect.getMetadata(META_ALIAS_KEY, Cls);
      const controllerPath = join(path);
      this.routerArr.push({
        controllerPath,
        arr,
        cls: Cls,
        aliasOptions,
      });
    }));
    return this.routerArr;
  }

  private log(...message: string[]) {
    console.log(
      yellow("[router]"),
      green(format(new Date(), "yyyy-MM-dd HH:mm:ss")),
      ...message,
    );
  }

  private async transResponseResult(
    context: Context,
    result: any,
    options: {
      target: InstanceType<Constructor>;
      args: any[];
      methodName: string;
      methodType: string; // get/post/put/delete
      fn: ControllerMethod;
    },
  ) {
    if (context.response.status === 304) {
      context.response.body = undefined;
    } else if (
      options.methodType.toLowerCase() === "get" && !this._diabledGetComputeEtag
    ) { // if get method, then deal 304
      await checkEtag(context, result);
    } else if (context.response.body === undefined) {
      context.response.body = result;
    }

    // response headers
    const headers: Record<string, string> = Reflect.getMetadata(
      META_HEADER_KEY,
      options.fn,
    );
    if (headers) {
      Object.keys(headers).forEach((key) => {
        context.response.headers.set(key, headers[key]);
      });
    }

    // response http code
    const code: number = Reflect.getMetadata(
      META_HTTP_CODE_KEY,
      options.fn,
    );
    if (code) {
      context.response.status = code;
    }
  }

  routes() {
    const routeStart = Date.now();
    const result = super.routes();
    const apiPrefixReg = this.apiPrefixOptions?.exclude;

    this.routerArr.forEach(
      ({ controllerPath, arr, aliasOptions: controllerAliasOptions }) => {
        let isAbsolute = controllerAliasOptions?.isAbsolute;
        if (!isAbsolute && apiPrefixReg) {
          isAbsolute = apiPrefixReg.some((str) => {
            const reg = typeof str === "string" ? new RegExp(str) : str;
            return reg.test(controllerPath);
          });
        }
        let contollerPathWithPrefix = isAbsolute
          ? controllerPath
          : join(this.apiPrefix, controllerPath);
        contollerPathWithPrefix = replacePrefixAndSuffix(
          contollerPathWithPrefix,
          this.apiPrefix,
          controllerPath,
        );
        const controllerAliasPath = controllerAliasOptions?.alias &&
          replacePrefixAndSuffix(
            controllerAliasOptions.alias,
            this.apiPrefix,
            controllerPath,
          );
        const startTime = Date.now();
        let lastCls;
        arr.forEach((routeMap: RouteMap) => {
          const {
            methodPath,
            aliasOptions,
            methodType,
            fn,
            methodName,
            instance,
            cls,
          } = routeMap;
          lastCls = cls;
          const isAbsolute = aliasOptions?.isAbsolute;
          const alias = aliasOptions?.alias;
          const originPath = isAbsolute
            ? replacePrefix(methodPath, this.apiPrefix)
            : join(contollerPathWithPrefix, methodPath);
          let aliasPath = alias ??
            (controllerAliasPath && !isAbsolute &&
              join(controllerAliasPath, methodPath));
          const funcStart = Date.now();
          const callback = async (context: Context) => {
            const originStatus = context.response.status; // 404
            const guardResult = await checkByGuard(instance, fn, context);
            if (!guardResult) {
              if (context.response.status === originStatus) {
                context.response.status = Status.Forbidden;
                context.response.body = STATUS_TEXT.get(Status.Forbidden);
              }
              return;
            }
            const args = await transferParam(instance, methodName, context);
            const result = await checkByInterceptors(
              context,
              this.globalInterceptors,
              fn,
              {
                target: instance,
                methodName,
                methodType,
                args,
                fn,
              },
            );
            await this.transResponseResult(
              context,
              context.response.body ?? result,
              {
                fn,
                target: instance,
                methodType,
                args,
                methodName,
              },
            );
          };
          this[methodType](originPath, callback);

          if (aliasPath) {
            aliasPath = replacePrefixAndSuffix(
              aliasPath,
              this.apiPrefix,
              methodPath,
              controllerPath,
            );
            this[methodType](aliasPath, callback);
          }
          const funcEnd = Date.now();
          this.log(
            yellow("[RouterExplorer]"),
            green(
              `Mapped {${
                aliasPath
                  ? (originPath + ", " + red(aliasPath))
                  : (isAbsolute ? red(originPath) : originPath)
              }, ${methodType.toUpperCase()}} route ${
                funcEnd -
                funcStart
              }ms`,
            ),
          );
        });

        const endTime = Date.now();
        const name = lastCls?.["name"];
        this.log(
          red("[RoutesResolver]"),
          blue(`${name} {${contollerPathWithPrefix}} ${endTime - startTime}ms`),
        );
      },
    );
    this.log(
      yellow("[Routes application]"),
      green(`successfully started ${Date.now() - routeStart}ms`),
    );
    return result;
  }
}
