// deno install --allow-env --allow-run --allow-net --allow-read --allow-write --import-map ./cli/import_map.json -n dest  -f ./cli/main.ts
import { Input, Select } from "cliffy/prompt/mod.ts";
import { Command } from "cliffy/command/mod.ts";
import { colors } from "cliffy/ansi/colors.ts";
import { createProject } from "./src/new.ts";

const info = colors.bold.blue;

function createNewProject() {
  return new Command().description("Generate Nest application.")
    .action(async () => {
      console.log(info("We will scaffold your app in a few seconds.."));
      const name: string = await Input.prompt({
        message: `What name would you like to use for the new project?`,
        default: "nest-app",
      });
      const platform: string = await Select.prompt({
        message:
          `Which platform would you like to download by the new project?`,
        options: ["gitee+ssh", "github+https", "github+ssh"],
      });
      await createProject(name, platform);
      console.log(info("Project created"));
      console.log(`🚀  Successfully created project ${name}
👉  Get started with the following commands:

$ cd ${name}
$ deno task dev
      `);
    });
}

if (import.meta.main) {
  await new Command()
    .name("nest")
    .description("The Nest CLI of Deno.")
    .meta("deno", Deno.version.deno)
    .meta("v8", Deno.version.v8)
    .meta("typescript", Deno.version.typescript)
    .default("new")
    .command("new n", createNewProject())
    .parse(Deno.args);
}
