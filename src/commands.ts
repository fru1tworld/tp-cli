import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export interface Bookmark {
  readonly alias: string;
  readonly path: string;
  readonly createdAt: number;
}

export interface TpConfig {
  readonly caseSensitive?: boolean;
}

export type ListOrder = "utf8" | "recent";

const ALIAS_COLUMN_WIDTH = 15;

export class CommandError extends Error {
  override readonly name = "CommandError";
}

export function getDataDir(): string {
  return join(homedir(), ".tp");
}

export function getDataFile(dataDir?: string): string {
  return join(dataDir ?? getDataDir(), "bookmarks.json");
}

export function getConfigFile(dataDir?: string): string {
  return join(dataDir ?? getDataDir(), "config.json");
}

export function loadConfig(configFile: string): TpConfig {
  if (!existsSync(configFile)) {
    return {};
  }

  const raw = readFileSync(configFile, "utf-8");
  try {
    return JSON.parse(raw) as TpConfig;
  } catch {
    throw new CommandError(`Invalid JSON in config file: ${configFile}`);
  }
}

export function init(dataFile: string): void {
  mkdirSync(dirname(dataFile), { recursive: true });
  if (!existsSync(dataFile)) {
    writeFileSync(dataFile, "[]");
  }
}

export function loadBookmarks(dataFile: string): Bookmark[] {
  init(dataFile);
  return JSON.parse(readFileSync(dataFile, "utf-8")) as Bookmark[];
}

export function saveBookmarks(
  dataFile: string,
  bookmarks: readonly Bookmark[],
): void {
  writeFileSync(dataFile, JSON.stringify(bookmarks, null, 2));
}

function aliasMatch(a: string, b: string, caseSensitive: boolean): boolean {
  return caseSensitive ? a === b : a.toLowerCase() === b.toLowerCase();
}

function findByAlias(
  bookmarks: readonly Bookmark[],
  alias: string,
  caseSensitive: boolean,
): Bookmark | undefined {
  return bookmarks.find((b) => aliasMatch(b.alias, alias, caseSensitive));
}

function findIndexByAlias(
  bookmarks: readonly Bookmark[],
  alias: string,
  caseSensitive: boolean,
): number {
  return bookmarks.findIndex((b) => aliasMatch(b.alias, alias, caseSensitive));
}

function isCaseSensitive(config: TpConfig): boolean {
  return config.caseSensitive ?? false;
}

function formatBookmarks(bookmarks: readonly Bookmark[]): string {
  return bookmarks
    .map((b) => `  ${b.alias.padEnd(ALIAS_COLUMN_WIDTH)} -> ${b.path}`)
    .join("\n");
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

  const bookmarks = loadBookmarks(dataFile);

  const existingAlias = findByAlias(bookmarks, alias, isCaseSensitive(config));
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

  saveBookmarks(dataFile, [
    { alias, path: cwd, createdAt: Date.now() },
    ...bookmarks,
  ]);
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

  const bookmarks = loadBookmarks(dataFile);
  const index = findIndexByAlias(bookmarks, alias, isCaseSensitive(config));

  if (index === -1) {
    throw new CommandError(`Alias '${alias}' not found.`);
  }

  saveBookmarks(dataFile, bookmarks.toSpliced(index, 1));
  return `Deleted: ${alias}`;
}

export function gc(dataFile: string): string {
  const alive: Bookmark[] = [];
  const dead: Bookmark[] = [];

  for (const bookmark of loadBookmarks(dataFile)) {
    (existsSync(bookmark.path) ? alive : dead).push(bookmark);
  }

  if (dead.length === 0) {
    return "No invalid bookmarks found. All directories exist.";
  }

  saveBookmarks(dataFile, alive);

  return [
    `Found ${dead.length} invalid bookmark(s):\n`,
    formatBookmarks(dead),
    `\nRemoved ${dead.length} invalid bookmark(s).`,
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

  const caseSensitive = isCaseSensitive(config);

  if (aliasMatch(oldAlias, newAlias, caseSensitive)) {
    throw new CommandError("Old alias and new alias are the same.");
  }

  const bookmarks = loadBookmarks(dataFile);
  const index = findIndexByAlias(bookmarks, oldAlias, caseSensitive);

  if (index === -1) {
    throw new CommandError(`Alias '${oldAlias}' not found.`);
  }

  const target = bookmarks[index];
  const existingNewAlias = findByAlias(bookmarks, newAlias, caseSensitive);

  if (existingNewAlias) {
    if (existingNewAlias.path !== target.path) {
      throw new CommandError(
        `Alias '${newAlias}' already exists with a different path.`,
      );
    }

    saveBookmarks(dataFile, bookmarks.toSpliced(index, 1));
    return [
      `'${oldAlias}' and '${newAlias}' point to the same directory: ${existingNewAlias.path}`,
      `Removed duplicate alias '${oldAlias}'. Keeping '${newAlias}'.`,
    ].join("\n");
  }

  saveBookmarks(
    dataFile,
    bookmarks.with(index, { ...target, alias: newAlias }),
  );
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

  const bookmarks = loadBookmarks(dataFile);
  const bookmark = findByAlias(bookmarks, alias, isCaseSensitive(config));

  if (!bookmark) {
    throw new CommandError(`Alias '${alias}' not found.`);
  }

  if (!existsSync(bookmark.path)) {
    throw new CommandError(`Directory no longer exists: ${bookmark.path}`);
  }

  return `__TP_CD__:${bookmark.path}`;
}

export function parseListOrder(arg?: string): ListOrder {
  switch (arg) {
    case undefined:
    case "-u":
    case "--utf8":
      return "utf8";
    case "-r":
    case "--recent":
      return "recent";
    default:
      throw new CommandError("Usage: tp list [-u|--utf8] [-r|--recent]");
  }
}

function compareUtf8(a: string, b: string): number {
  return Buffer.from(a, "utf-8").compare(Buffer.from(b, "utf-8"));
}

const LIST_ORDERS = {
  utf8: {
    header: "UTF-8 order",
    sort: (bookmarks: readonly Bookmark[]) =>
      bookmarks.toSorted((a, b) => compareUtf8(a.alias, b.alias)),
  },
  recent: {
    header: "newest first",
    sort: (bookmarks: readonly Bookmark[]) => bookmarks,
  },
} as const satisfies Record<
  ListOrder,
  {
    header: string;
    sort: (bookmarks: readonly Bookmark[]) => readonly Bookmark[];
  }
>;

export function list(dataFile: string, order: ListOrder = "utf8"): string {
  const bookmarks = loadBookmarks(dataFile);

  if (bookmarks.length === 0) {
    return "No bookmarks yet. Use 'tp add <alias>' to add one.";
  }

  const { header, sort } = LIST_ORDERS[order];
  return `Bookmarks (${header}):\n\n${formatBookmarks(sort(bookmarks))}`;
}

function packageRoot(): string {
  return join(dirname(fileURLToPath(import.meta.url)), "..");
}

export function version(): string {
  const pkgPath = join(packageRoot(), "package.json");
  const pkg = JSON.parse(readFileSync(pkgPath, "utf-8")) as { version: string };
  return pkg.version;
}

export const SUPPORTED_SHELLS = ["bash", "zsh", "fish", "nu"] as const;

export type Shell = (typeof SUPPORTED_SHELLS)[number];

function isShell(value: string | undefined): value is Shell {
  return SUPPORTED_SHELLS.some((shell) => shell === value);
}

export function shellInit(shell?: string): string {
  if (!isShell(shell)) {
    throw new CommandError(
      `Usage: tp-cli init <${SUPPORTED_SHELLS.join("|")}>`,
    );
  }

  return readFileSync(join(packageRoot(), `tp.${shell}`), "utf-8").trimEnd();
}

export function help(): string {
  return `tp - Teleport to bookmarked directories

Usage:
  tp <alias>            Go to bookmarked directory
  tp add <alias>        Bookmark current directory
  tp del <alias>        Delete bookmark
  tp ch <old> <new>     Rename alias (or merge if same path)
  tp gc                 Remove bookmarks for non-existent directories
  tp list               Show all bookmarks (UTF-8 order)
  tp list -r            Show all bookmarks (newest first)
  tp help               Show this help
  tp -v, --version      Show version

Shell setup:
  tp-cli init <shell>   Print the shell wrapper (bash|zsh|fish|nu)

  bash  eval "$(tp-cli init bash)"        in ~/.bashrc
  zsh   eval "$(tp-cli init zsh)"         in ~/.zshrc
  fish  tp-cli init fish | source         in ~/.config/fish/config.fish
  nu    tp-cli init nu | save -f ~/.tp/tp.nu   then: source ~/.tp/tp.nu`;
}

export function completions(dataFile: string): string {
  return loadBookmarks(dataFile)
    .map((b) => b.alias)
    .join("\n");
}
