// deno-lint-ignore-file no-explicit-any
import { ejs, join } from "../deps.ts";

let baseViewsDir: string | undefined;

export function Render(path: string): MethodDecorator {
  return (_target, _property, descriptor: TypedPropertyDescriptor<any>) => {
    const originalMethod = descriptor.value;
    if (originalMethod) {
      descriptor.value = async function (...args: any[]) {
        const result = await originalMethod.apply(this, args);
        if (result) {
          let lastPath = path;
          if (!lastPath.endsWith(".ejs")) {
            lastPath = lastPath + ".ejs";
          }
          if (baseViewsDir) {
            lastPath = join(baseViewsDir, lastPath);
          }
          return await ejs.renderFile(lastPath, result);
        }
        return result;
      };
    }
  };
}

export function setBaseViewsDir(path: string) {
  baseViewsDir = path;
}
