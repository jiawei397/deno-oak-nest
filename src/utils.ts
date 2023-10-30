import { Context } from "./interfaces/context.interface.ts";
import { APP_CRON, APP_CRON_INSTANCE } from "./constants.ts";
import { Reflect } from "../deps.ts";
import { Constructor, Instance } from "./interfaces/type.interface.ts";
import { AliasOptions } from "./interfaces/controller.interface.ts";

export function isDebug() {
  return Deno.env.get("DEBUG") === "true";
}

export function parseSearch(search: string) {
  const str = search.startsWith("?") ? search.substring(1) : search;
  if (!str) {
    return {};
  }
  const arr = str.split("&");
  const map: Record<string, string | string[]> = {};
  arr.forEach((item) => {
    const [k, v] = item.split("=");
    const value = map[k];
    if (value) {
      if (Array.isArray(value)) {
        map[k] = [...value, v];
      } else {
        map[k] = [value, v];
      }
    } else {
      map[k] = v;
    }
  });
  return map;
}

export function parseSearchParams(search: URLSearchParams) {
  const map: Record<string, string | string[]> = {};
  search.forEach((v, k) => {
    const value = map[k];
    if (value) {
      if (Array.isArray(value)) {
        map[k] = [...value, v];
      } else {
        map[k] = [value, v];
      }
    } else {
      map[k] = v;
    }
  });
  return map;
}

export interface ReadableStreamResult {
  body: ReadableStream;
  /** write message to stream, but it may cause error if the connection closed before */
  write(message: string): void;
  /** write last message and end signal to stream, but it may cause error if the connection closed before */
  end(message?: string): void;
}

export function setCacheControl(context: Context) {
  // cache-control see https://cloud.tencent.com/developer/section/1189911
  const requestCacheControl = context.request.header("Cache-Control");
  let responseCacheControl = context.response.headers.get("Cache-Control");
  if (!responseCacheControl) {
    if (requestCacheControl) {
      const cacheArr = requestCacheControl.split(",");
      const cacheResHeaders = [
        "max-age",
        "no-cache",
        "no-store",
        "no-transform",
      ];
      responseCacheControl = cacheArr.filter((str) => {
        const key = str.split("=")[0];
        return cacheResHeaders.includes(key.trim().toLowerCase());
      }).join(",");
    } else {
      responseCacheControl = "no-cache";
    }
    context.response.headers.set("Cache-Control", responseCacheControl);
  }
}

export function getReadableStream(): ReadableStreamResult {
  let controller: ReadableStreamDefaultController;
  const body = new ReadableStream({
    start(_controller) {
      controller = _controller;
    },
  });
  const te = new TextEncoder();
  return {
    body,
    write(message: string) {
      controller.enqueue(te.encode(message));
    },
    end(message?: string) {
      if (message) {
        controller.enqueue(te.encode(message));
      }
      controller.close();
    },
  };
}

export function joinPath(...paths: string[]) {
  if (paths.length === 0) {
    return "/";
  }
  const str = paths.join("/").replaceAll("///", "/").replaceAll("//", "/");
  let last = str;
  if (!last.startsWith("/")) {
    last = "/" + last;
  }
  if (last.endsWith("/")) {
    last = last.substring(0, last.length - 1);
  }
  return last || "/";
}

export function replaceAliasPath(
  str: string,
  options: {
    prefix?: string;
    controller?: string;
    controllerAliasPath?: string;
    method?: string;
  },
) {
  return joinPath(
    str.replace(/\$\{prefix\}/, options.prefix || "")
      .replace(/\$\{method\}/, options.method || "")
      .replace(/\$\{controller\}/, options.controller || "")
      .replace(/\$\{controllerAlias\}/, options.controllerAliasPath || ""),
  );
}

export function storeCronInstance(provider: Constructor, instance: Instance) {
  if (Reflect.getMetadata(APP_CRON, provider)) { // this is Cron Service, store its cache
    Reflect.defineMetadata(APP_CRON_INSTANCE, instance, provider);
  }
}

export function getCronInstance(provider: Constructor): Instance | undefined {
  return Reflect.getMetadata(APP_CRON_INSTANCE, provider);
}

export function flagCronProvider(provider: Constructor) {
  Reflect.defineMetadata(APP_CRON, true, provider);
}

export type MethodPathOptions = {
  apiPrefix?: string;
  controllerPathWithPrefix?: string;
  controllerAliasPath?: string;
  controllerPath: string;
  methodPath: string;
  methodAliasOptions?: AliasOptions;
};
export function getMethodPaths(params: MethodPathOptions) {
  const {
    apiPrefix = "",
    controllerPathWithPrefix,
    controllerAliasPath,
    controllerPath,
    methodPath,
    methodAliasOptions,
  } = params;

  const methodAlias = methodAliasOptions?.isAliasOnly
    ? (methodAliasOptions?.alias || methodPath)
    : methodAliasOptions?.alias;
  const originPath = methodAliasOptions?.isAliasOnly
    ? undefined
    : controllerPathWithPrefix &&
      joinPath(controllerPathWithPrefix, methodPath);
  let aliasPath: string | undefined = undefined;
  if (methodAlias) {
    aliasPath = methodAlias;
  } else if (controllerAliasPath) {
    aliasPath = joinPath(controllerAliasPath, methodPath);
  }
  if (aliasPath) {
    aliasPath = replaceAliasPath(
      aliasPath,
      {
        prefix: apiPrefix,
        controller: controllerPath,
        controllerAliasPath,
        method: methodPath,
      },
    );
  }

  return {
    originPath,
    aliasPath,
  };
}

export type ControllerPathOptions = {
  prefix?: string;
  controllerPath: string;
  controllerAliasOptions?: AliasOptions;
};

export function getControllerPaths(options: ControllerPathOptions): {
  controllerPathWithPrefix?: string;
  controllerAliasPath?: string;
} {
  const {
    prefix = "",
    controllerPath,
    controllerAliasOptions,
  } = options;
  const controllerPathWithPrefix = controllerAliasOptions?.isAliasOnly
    ? undefined
    : joinPath(prefix, controllerPath);
  const controllerAliasPath =
    (controllerAliasOptions?.isAliasOnly || controllerAliasOptions?.alias) &&
    replaceAliasPath(
      controllerAliasOptions.alias || controllerPath,
      {
        prefix,
        controller: controllerPath,
      },
    );
  return {
    controllerPathWithPrefix,
    controllerAliasPath,
  };
}
