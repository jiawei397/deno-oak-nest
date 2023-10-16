import { ensureDir } from "std/fs/ensure_dir.ts";
import { Input, Select } from "cliffy/prompt/mod.ts";
import { Command } from "cliffy/command/mod.ts";
import { colors } from "cliffy/ansi/colors.ts";

const info = colors.bold.blue;
const error = colors.bold.red;

import {
  getController,
  getDecorator,
  getExceptionFilter,
  getGuard,
  getInterceptor,
  getMiddleware,
  getModule,
  getService,
} from "./generate_utils.ts";

const GenerateTypes = {
  "ExceptionFilter": "exceptionFilter",
  "Controller": "controller",
  "Decorator": "decorator",
  "Interceptor": "interceptor",
  "Guard": "guard",
  "Middleware": "middleware",
  "Module": "module",
  "Service": "service",
};

type GenerateType = keyof typeof GenerateTypes;

function getGenerateBody(type: GenerateType, name: string): string {
  switch (type) {
    case "Controller":
      return getController(name);
    case "Service":
      return getService(name);
    case "Module":
      return getModule(name);
    case "Middleware":
      return getMiddleware(name);
    case "Guard":
      return getGuard(name);
    case "ExceptionFilter":
      return getExceptionFilter(name);
    case "Interceptor":
      return getInterceptor(name);
    case "Decorator":
      return getDecorator(name);
    default:
      return "";
  }
}

//将文件名转换，比如UserInfo转换为user_info
function getLowerCaseFileName(name: string): string {
  return name.replace(/([A-Z])/g, "_$1").toLowerCase().replace(/^_/, "");
}

function getFileName(name: string, type: GenerateType): string {
  return `${getLowerCaseFileName(name)}.${getLowerCaseFileName(type)}.ts`;
}

function calculateBytesAndKb(str: string) {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(str);
  const bytesCount = bytes.length;
  if (bytesCount >= 1024) {
    const kb = bytesCount / 1024;
    return `${kb.toFixed(2)} KB`;
  }
  return `${bytesCount} bytes`;
}

export async function generate(type: GenerateType, name: string) {
  const dirname = getLowerCaseFileName(name);
  await ensureDir(dirname);
  const body = getGenerateBody(type, name);
  const fileName = getFileName(name, type);

  const filePath = `${dirname}/${fileName}`;
  await Deno.writeTextFile(filePath, body);
  console.info(info("CREATE"), `${filePath} (${calculateBytesAndKb(body)})`);
}

export function generateCommand() {
  return new Command().description("Generate a Nest element.")
    .arguments("[element:string]")
    // deno-lint-ignore no-explicit-any
    .action(async (_options: unknown, ...args: any[]) => {
      let type: GenerateType = args[0] as GenerateType;
      if (!type) {
        type = await Select.prompt({
          message: `Which Nest element would you like to create?`,
          options: Object.keys(GenerateTypes),
        }) as GenerateType;
      } else {
        if (!GenerateTypes[type]) {
          const msg =
            `Invalid schematic "${type}". Please, ensure that "${type}" exists in this collection.`;
          console.error(error(msg));
          return;
        }
      }
      const name: string = await Input.prompt({
        message: `What name would you like to use for the ${
          GenerateTypes[type]
        }?`,
        minLength: 1,
      });
      await generate(type, name);
    });
}
