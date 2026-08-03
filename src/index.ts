#!/usr/bin/env node

import { realpathSync } from "node:fs";
import { argv, exit, cwd as processCwd } from "node:process";
import { fileURLToPath } from "node:url";
import {
  add,
  CommandError,
  ch,
  completions,
  del,
  gc,
  getConfigFile,
  getDataFile,
  go,
  help,
  list,
  loadConfig,
  parseListOrder,
  shellInit,
  type TpConfig,
  version,
} from "./commands.js";

export function main(
  args: readonly string[],
  cwd: string,
  dataFile: string,
  config: TpConfig = {},
): string {
  const [command, ...rest] = args;

  switch (command) {
    case "add":
      return add(rest[0], cwd, dataFile, config);
    case "del":
      return del(rest[0], dataFile, config);
    case "ch":
      return ch(rest[0], rest[1], dataFile, config);
    case "gc":
      return gc(dataFile);
    case "init":
      return shellInit(rest[0]);
    case undefined:
    case "list":
      return list(dataFile, parseListOrder(rest[0]));
    case "help":
    case "-h":
    case "--help":
      return help();
    case "-v":
    case "--version":
      return version();
    case "--completions":
      return completions(dataFile);
    default:
      return go(command, dataFile, config);
  }
}

/* v8 ignore start */
// The npm global bin is a symlink, so argv[1] differs from the module path.
if (realpathSync(argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const config = loadConfig(getConfigFile());
    console.log(main(argv.slice(2), processCwd(), getDataFile(), config));
  } catch (err) {
    if (err instanceof CommandError) {
      console.log(err.message);
      exit(1);
    }
    throw err;
  }
}
/* v8 ignore stop */
