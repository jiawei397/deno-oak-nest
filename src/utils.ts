import type { Context } from "./interfaces/context.interface.ts";
import { APP_CRON, APP_CRON_INSTANCE } from "./constants.ts";
import { Reflect } from "./deps.ts";
import type { Constructor, Instance } from "./interfaces/type.interface.ts";
import type {
  AliasOptions,
  SSEMessageEvent,
} from "./interfaces/controller.interface.ts";

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

export function getReadableStream(
  options?: ReadableStreamOptions,
): ReadableStreamResult {
  let controller: ReadableStreamDefaultController;
  const body = new ReadableStream({
    start(_controller) {
      controller = _controller;
    },
    cancel: options?.cancel,
  });
  const te = new TextEncoder();
  const write = (message: string) => {
    try {
      controller.enqueue(te.encode(message));
    } catch (err) {
      console.error("write", err);
    }
  };
  return {
    body,
    write,
    end(message?: string) {
      if (message) {
        write(message);
      }
      try {
        controller.close();
      } catch (err) {
        console.error("end", err);
      }
    },
  };
}

export interface ReadableStreamResult {
  body: ReadableStream;
  /** write message to stream, but it may log error if the connection closed before */
  write(message: string): void;
  /** write last message and end signal to stream, but it may log error if the connection closed before */
  end(message?: string): void;
}

export interface ReadableSSEStreamResult {
  body: ReadableStream;
  /** write message to stream, but it may log error if the connection closed before */
  write(messageEvent: SSEMessageEvent): void;
  /**
   * write last message and end signal to stream, but it may log error if the connection closed before
   * @warning SSEStream should be closed by client, so you should use `cancel` option to receive the event, not use `end` method directly.
   */
  end(): void;
}

export interface ReadableStreamOptions {
  /**
   * If the client close the connection, the `cancel` will be called.
   */
  cancel?: UnderlyingSourceCancelCallback;
}

export function getSSEStream(
  options?: ReadableStreamOptions,
): ReadableSSEStreamResult {
  const { body, write, end } = getReadableStream(options);
  return {
    body,
    write(messageEvent: SSEMessageEvent) {
      const { data, event, id, retry } = messageEvent;
      if (retry) {
        write(`retry: ${retry}\n`);
      }
      if (id !== undefined) {
        write(`id: ${id}\n`);
      }
      if (event) {
        write(`event: ${event}\n`);
      }
      const dataStr = typeof data === "string" ? data : JSON.stringify(data);
      write(`data: ${dataStr}\n\n`);
    },
    end,
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

  let methodAlias = methodAliasOptions?.alias;
  if (methodAliasOptions?.isAliasOnly && !methodAlias) {
    methodAlias = methodPath;
  }
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
