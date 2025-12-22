import { lstatSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve } from "pathe";

const root = fileURLToPath(new URL(".", import.meta.url));

function r(p: string, base = root) {
  return resolve(base, p);
}

function globSubDirAlias(dir: string, prefix = "@") {
  try {
    return readdirSync(dir)
      .filter((p) => lstatSync(r(p, dir)).isDirectory())
      .map((sub) => ({
        find: `${prefix}/${sub}`,
        replacement: `${dir}/${sub}`,
      }));
  } catch (error) {
    console.error(error);
    return [];
  }
}

export const ROOT_DIR = r("");
export const DEMO_DIR = r("demos");

export const viteAlias = [
  { find: /^~\//, replacement: `${ROOT_DIR}/` },
  ...globSubDirAlias(DEMO_DIR),
];

// console.log(viteAlias);
