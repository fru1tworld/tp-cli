import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

export interface Bookmark {
  alias: string;
  path: string;
  createdAt: number;
}

export interface TpConfig {
  caseSensitive?: boolean;
}

export function getConfigFile(dataDir?: string): string {
  return path.join(dataDir ?? getDataDir(), "config.json");
}

export function loadConfig(configFile: string): TpConfig {
  try {
    const data = fs.readFileSync(configFile, "utf-8");
    return JSON.parse(data);
  } catch {
    return {};
  }
}

function aliasMatch(a: string, b: string, caseSensitive: boolean): boolean {
  return caseSensitive ? a === b : a.toLowerCase() === b.toLowerCase();
}

function findByAlias(
  bookmarks: Bookmark[],
  alias: string,
  caseSensitive: boolean,
): Bookmark | undefined {
  return bookmarks.find((b) => aliasMatch(b.alias, alias, caseSensitive));
}

function findIndexByAlias(
  bookmarks: Bookmark[],
  alias: string,
  caseSensitive: boolean,
): number {
  return bookmarks.findIndex((b) => aliasMatch(b.alias, alias, caseSensitive));
}

export class CommandError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CommandError";
  }
}

export function getDataDir(): string {
  return path.join(os.homedir(), ".tp");
}

export function getDataFile(dataDir?: string): string {
  return path.join(dataDir ?? getDataDir(), "bookmarks.json");
}

export function init(dataFile: string): void {
  const dir = path.dirname(dataFile);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(dataFile)) {
    fs.writeFileSync(dataFile, "[]");
  }
}

export function loadBookmarks(dataFile: string): Bookmark[] {
  init(dataFile);
  const data = fs.readFileSync(dataFile, "utf-8");
  return JSON.parse(data);
}

export function saveBookmarks(dataFile: string, bookmarks: Bookmark[]): void {
  fs.writeFileSync(dataFile, JSON.stringify(bookmarks, null, 2));
}

export function add(
  alias: string,
  cwd: string,
  dataFile: string,
  config: TpConfig = {},
): string {
  if (!alias) {
    throw new CommandError("Usage: tp add <alias>");
  }

  const caseSensitive = config.caseSensitive ?? false;
  const bookmarks = loadBookmarks(dataFile);

  const existingAlias = findByAlias(bookmarks, alias, caseSensitive);
  if (existingAlias) {
    throw new CommandError(
      `Alias '${existingAlias.alias}' already exists. Use 'tp del ${existingAlias.alias}' first.`,
    );
  }

  const existingPath = bookmarks.find((b) => b.path === cwd);
  if (existingPath) {
    throw new CommandError(
      `This path is already registered as '${existingPath.alias}'.`,
    );
  }

  bookmarks.unshift({ alias, path: cwd, createdAt: Date.now() });
  saveBookmarks(dataFile, bookmarks);
  return `Added: ${alias} -> ${cwd}`;
}

export function del(
  alias: string,
  dataFile: string,
  config: TpConfig = {},
): string {
  if (!alias) {
    throw new CommandError("Usage: tp del <alias>");
  }

  const caseSensitive = config.caseSensitive ?? false;
  const bookmarks = loadBookmarks(dataFile);
  const index = findIndexByAlias(bookmarks, alias, caseSensitive);

  if (index === -1) {
    throw new CommandError(`Alias '${alias}' not found.`);
  }

  bookmarks.splice(index, 1);
  saveBookmarks(dataFile, bookmarks);
  return `Deleted: ${alias}`;
}

export function gc(dataFile: string): string {
  const bookmarks = loadBookmarks(dataFile);
  const validBookmarks = bookmarks.filter((b) => fs.existsSync(b.path));
  const invalidBookmarks = bookmarks.filter((b) => !fs.existsSync(b.path));

  if (invalidBookmarks.length === 0) {
    return "No invalid bookmarks found. All directories exist.";
  }

  const invalidList = invalidBookmarks
    .map((b) => `  ${b.alias.padEnd(15)} -> ${b.path}`)
    .join("\n");

  saveBookmarks(dataFile, validBookmarks);

  return [
    `Found ${invalidBookmarks.length} invalid bookmark(s):\n`,
    invalidList,
    `\nRemoved ${invalidBookmarks.length} invalid bookmark(s).`,
  ].join("\n");
}

export function ch(
  oldAlias: string,
  newAlias: string,
  dataFile: string,
  config: TpConfig = {},
): string {
  if (!oldAlias || !newAlias) {
    throw new CommandError("Usage: tp ch <old_alias> <new_alias>");
  }

  const caseSensitive = config.caseSensitive ?? false;

  if (aliasMatch(oldAlias, newAlias, caseSensitive)) {
    throw new CommandError("Old alias and new alias are the same.");
  }

  const bookmarks = loadBookmarks(dataFile);
  const index = findIndexByAlias(bookmarks, oldAlias, caseSensitive);

  if (index === -1) {
    throw new CommandError(`Alias '${oldAlias}' not found.`);
  }

  const existingNewAlias = findByAlias(bookmarks, newAlias, caseSensitive);
  if (existingNewAlias) {
    if (existingNewAlias.path === bookmarks[index].path) {
      bookmarks.splice(index, 1);
      saveBookmarks(dataFile, bookmarks);
      return [
        `'${oldAlias}' and '${newAlias}' point to the same directory: ${existingNewAlias.path}`,
        `Removed duplicate alias '${oldAlias}'. Keeping '${newAlias}'.`,
      ].join("\n");
    }
    throw new CommandError(
      `Alias '${newAlias}' already exists with a different path.`,
    );
  }

  bookmarks[index].alias = newAlias;
  saveBookmarks(dataFile, bookmarks);
  return `Renamed: '${oldAlias}' -> '${newAlias}'`;
}

export function go(
  alias: string,
  dataFile: string,
  config: TpConfig = {},
): string {
  if (!alias) {
    throw new CommandError("Usage: tp <alias>");
  }

  const caseSensitive = config.caseSensitive ?? false;
  const bookmarks = loadBookmarks(dataFile);
  const bookmark = findByAlias(bookmarks, alias, caseSensitive);

  if (!bookmark) {
    throw new CommandError(`Alias '${alias}' not found.`);
  }

  if (!fs.existsSync(bookmark.path)) {
    throw new CommandError(`Directory no longer exists: ${bookmark.path}`);
  }

  return `__TP_CD__:${bookmark.path}`;
}

export function list(dataFile: string): string {
  const bookmarks = loadBookmarks(dataFile);

  if (bookmarks.length === 0) {
    return "No bookmarks yet. Use 'tp add <alias>' to add one.";
  }

  const bookmarkList = bookmarks
    .map((b) => `  ${b.alias.padEnd(15)} -> ${b.path}`)
    .join("\n");

  return `Bookmarks (newest first):\n\n${bookmarkList}`;
}

export function version(): string {
  const pkgPath = path.join(__dirname, "..", "package.json");
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
  return pkg.version;
}

export function help(): string {
  return `tp - Teleport to bookmarked directories

Usage:
  tp <alias>            Go to bookmarked directory
  tp add <alias>        Bookmark current directory
  tp del <alias>        Delete bookmark
  tp ch <old> <new>     Rename alias (or merge if same path)
  tp gc                 Remove bookmarks for non-existent directories
  tp list               Show all bookmarks
  tp help               Show this help
  tp -v, --version      Show version`;
}

export function completions(dataFile: string): string {
  const bookmarks = loadBookmarks(dataFile);
  return bookmarks.map((b) => b.alias).join("\n");
}
