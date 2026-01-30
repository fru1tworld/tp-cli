#!/usr/bin/env node

import {
  add,
  del,
  gc,
  ch,
  go,
  list,
  version,
  help,
  completions,
  getDataFile,
  CommandError,
} from "./commands";

export function main(
  args: string[],
  cwd: string,
  dataFile: string
): string {
  const command = args[0];

  switch (command) {
    case "add":
      return add(args[1], cwd, dataFile);
    case "del":
      return del(args[1], dataFile);
    case "ch":
      return ch(args[1], args[2], dataFile);
    case "gc":
      return gc(dataFile);
    case "list":
      return list(dataFile);
    case "help":
    case "-h":
    case "--help":
      return help();
    case "-v":
    case "--version":
      return version();
    case "--completions":
      return completions(dataFile);
    case undefined:
      return list(dataFile);
    default:
      return go(command, dataFile);
  }
}

/* v8 ignore start -- entry point bootstrap, tested via subprocess in cli.test.ts */
if (require.main === module) {
  try {
    const output = main(
      process.argv.slice(2),
      process.cwd(),
      getDataFile()
    );
    console.log(output);
  } catch (err) {
    if (err instanceof CommandError) {
      console.log(err.message);
      process.exit(1);
    }
    throw err;
  }
}
/* v8 ignore stop */
