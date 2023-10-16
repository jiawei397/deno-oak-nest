import { applyEdits, modify, parse as parseJson } from "jsonc";
import { decompress } from "zip";
import { join } from "std/path/mod.ts";

const projectName = "deno_nest_template";
const branchName = "main";
const githubUrl =
  `https://github.com/jiawei397/${projectName}/archive/refs/heads/${branchName}.zip`;
const githubGit = `git@github.com:jiawei397/${projectName}.git`;
const giteeGit = `git@gitee.com:JiQingYun/${projectName}.git`;
const zipName = projectName + ".zip";
const templateName = projectName;

export type Platform = "github+ssh" | "github+https" | "gitee+ssh";

function getUrl(platform: string) {
  switch (platform) {
    case "github+ssh":
      return githubGit;
    case "github+https":
      return githubUrl;
    case "gitee+ssh":
      return giteeGit;
    default:
      return githubUrl;
  }
}

async function downloadUrl(url: string, fileName: string) {
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/zip",
    },
  });
  const buffer = await response.arrayBuffer();
  return Deno.writeFile(fileName, new Uint8Array(buffer));
}

async function downloadGit(url: string, dest: string) {
  const gitclone = await import("npm:git-clone");
  return new Promise((resolve, reject) => {
    gitclone.default(
      url,
      dest,
      { checkout: branchName, clone: true },
      function (err: Error | undefined) {
        if (err === undefined) {
          Deno.removeSync(`${dest}/.git`, { recursive: true });
          resolve(null);
        } else {
          console.log(err);
          reject(err);
        }
      },
    );
  });
}

async function downloadUrlAndUnzip(url: string, destName: string) {
  await downloadUrl(url, zipName);
  await decompress(zipName, "./");
  await Deno.rename(projectName + "-" + branchName, destName);
  await Deno.remove(zipName);
}

function modifyAndFormat(text: string, key: string, value: string): string {
  const modifyVersion = modify(text, [key], value, {
    formattingOptions: {
      insertSpaces: true,
      tabSize: 2,
    },
  });
  return applyEdits(
    text,
    modifyVersion,
  );
}

function modifyText(text: string, map: Record<string, string>) {
  return Object.keys(map).reduce((acc, key) => {
    return modifyAndFormat(acc, key, map[key]);
  }, text);
}

async function writeDenoJson(name: string, denoJsonPath: string) {
  //   console.log(`[${denoJsonPath}] will be changed`);
  const realPath = join(name, denoJsonPath);
  let text = await Deno.readTextFile(realPath);
  text = text.replace(templateName, name);
  const pkg: { version: string } = parseJson(text);
  const result = modifyText(text, {
    name,
    "version": "1.0.0",
    "template_version": pkg.version,
  });
  await Deno.writeTextFile(realPath, result);
}

async function writeReadme(name: string) {
  const realPath = join(name, "README.md");
  const doc = await Deno.readTextFile(realPath).catch((_) => null);
  if (!doc) {
    console.warn(`Not found【${realPath}】`);
    return;
  }
  const newDoc = doc.replaceAll(templateName, name);
  await Deno.writeTextFile(realPath, newDoc);
}

export async function createProject(
  name: string,
  platform: string,
) {
  const url = getUrl(platform);
  if (platform.endsWith("ssh")) {
    await downloadGit(url, name);
  } else {
    await downloadUrlAndUnzip(url, name);
  }

  await writeReadme(name);
  await writeDenoJson(name, "deno.jsonc");

  //   console.log(`init project ${projectName} end`);
}