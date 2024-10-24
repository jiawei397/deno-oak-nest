import { colors, Command, fs, Input, Select } from "../deps.ts";
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

const info = colors.bold.blue;
const error = colors.bold.red;

const GenerateTypes = {
  "exceptionFilter": getExceptionFilter,
  "controller": getController,
  "decorator": getDecorator,
  "interceptor": getInterceptor,
  "guard": getGuard,
  "middleware": getMiddleware,
  "module": getModule,
  "service": getService,
};

type GenerateType = keyof typeof GenerateTypes;

function getGenerateBody(type: GenerateType, name: string): string {
  return GenerateTypes[type](name);
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
  await fs.ensureDir(dirname);
  const body = getGenerateBody(type, name);
  const fileName = getFileName(name, type);

  const filePath = `${dirname}/${fileName}`;
  await Deno.writeTextFile(filePath, body);
  console.info(info("CREATE"), `${filePath} (${calculateBytesAndKb(body)})`);
}

export function generateCommand() {
  return new Command().description("Generate a Nest element.")
    .arguments("[element:string] [name:string]")
    // deno-lint-ignore no-explicit-any
    .action(async (_options: unknown, ...args: any[]) => {
      let type: GenerateType | undefined = args[0];
      let name: string | undefined = args[1];
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
      if (!name) {
        name = await Input.prompt({
          message: `What name would you like to use for the ${type}?`,
          minLength: 1,
        });
        if (!name) {
          console.error(error("The name must not be empty"));
          return;
        }
      }
      await generate(type, name);
    });
}
