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
  getConfigFile,
  loadConfig,
  CommandError,
  TpConfig,
} from "./commands";

export function main(
  args: string[],
  cwd: string,
  dataFile: string,
  config: TpConfig = {}
): string {
  const command = args[0];

  switch (command) {
    case "add":
      return add(args[1], cwd, dataFile, config);
    case "del":
      return del(args[1], dataFile, config);
    case "ch":
      return ch(args[1], args[2], dataFile, config);
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
      return go(command, dataFile, config);
  }
}

/* v8 ignore start -- entry point bootstrap, tested via subprocess in cli.test.ts */
if (require.main === module) {
  try {
    const configFile = getConfigFile();
    const config = loadConfig(configFile);
    const output = main(
      process.argv.slice(2),
      process.cwd(),
      getDataFile(),
      config
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
