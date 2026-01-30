import * as fs from "fs";
import * as path from "path";
import * as os from "os";

export interface Bookmark {
  alias: string;
  path: string;
  createdAt: number;
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

export function add(alias: string, cwd: string, dataFile: string): string {
  if (!alias) {
    throw new CommandError("Usage: tp add <alias>");
  }

  const bookmarks = loadBookmarks(dataFile);

  const existingAlias = bookmarks.find((b) => b.alias === alias);
  if (existingAlias) {
    throw new CommandError(
      `Alias '${alias}' already exists. Use 'tp del ${alias}' first.`
    );
  }

  const existingPath = bookmarks.find((b) => b.path === cwd);
  if (existingPath) {
    throw new CommandError(
      `This path is already registered as '${existingPath.alias}'.`
    );
  }

  bookmarks.unshift({
    alias,
    path: cwd,
    createdAt: Date.now(),
  });

  saveBookmarks(dataFile, bookmarks);
  return `Added: ${alias} -> ${cwd}`;
}

export function del(alias: string, dataFile: string): string {
  if (!alias) {
    throw new CommandError("Usage: tp del <alias>");
  }

  const bookmarks = loadBookmarks(dataFile);
  const index = bookmarks.findIndex((b) => b.alias === alias);

  if (index === -1) {
    throw new CommandError(`Alias '${alias}' not found.`);
  }

  bookmarks.splice(index, 1);
  saveBookmarks(dataFile, bookmarks);
  return `Deleted: ${alias}`;
}

export function gc(dataFile: string): string {
  const bookmarks = loadBookmarks(dataFile);
  const invalidBookmarks: Bookmark[] = [];
  const validBookmarks: Bookmark[] = [];

  for (const b of bookmarks) {
    if (fs.existsSync(b.path)) {
      validBookmarks.push(b);
    } else {
      invalidBookmarks.push(b);
    }
  }

  if (invalidBookmarks.length === 0) {
    return "No invalid bookmarks found. All directories exist.";
  }

  const lines: string[] = [];
  lines.push(`Found ${invalidBookmarks.length} invalid bookmark(s):\n`);
  for (const b of invalidBookmarks) {
    lines.push(`  ${b.alias.padEnd(15)} -> ${b.path}`);
  }

  saveBookmarks(dataFile, validBookmarks);
  lines.push(`\nRemoved ${invalidBookmarks.length} invalid bookmark(s).`);
  return lines.join("\n");
}

export function ch(
  oldAlias: string,
  newAlias: string,
  dataFile: string
): string {
  if (!oldAlias || !newAlias) {
    throw new CommandError("Usage: tp ch <old_alias> <new_alias>");
  }

  if (oldAlias === newAlias) {
    throw new CommandError("Old alias and new alias are the same.");
  }

  const bookmarks = loadBookmarks(dataFile);
  const index = bookmarks.findIndex((b) => b.alias === oldAlias);

  if (index === -1) {
    throw new CommandError(`Alias '${oldAlias}' not found.`);
  }

  const existingNewAlias = bookmarks.find((b) => b.alias === newAlias);
  if (existingNewAlias) {
    if (existingNewAlias.path === bookmarks[index].path) {
      const lines: string[] = [];
      lines.push(
        `'${oldAlias}' and '${newAlias}' point to the same directory: ${existingNewAlias.path}`
      );
      bookmarks.splice(index, 1);
      saveBookmarks(dataFile, bookmarks);
      lines.push(
        `Removed duplicate alias '${oldAlias}'. Keeping '${newAlias}'.`
      );
      return lines.join("\n");
    } else {
      throw new CommandError(
        `Alias '${newAlias}' already exists with a different path.`
      );
    }
  }

  bookmarks[index].alias = newAlias;
  saveBookmarks(dataFile, bookmarks);
  return `Renamed: '${oldAlias}' -> '${newAlias}'`;
}

export function go(alias: string, dataFile: string): string {
  if (!alias) {
    throw new CommandError("Usage: tp <alias>");
  }

  const bookmarks = loadBookmarks(dataFile);
  const bookmark = bookmarks.find((b) => b.alias === alias);

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

  const lines: string[] = [];
  lines.push("Bookmarks (newest first):\n");
  for (const b of bookmarks) {
    const alias = b.alias.padEnd(15);
    lines.push(`  ${alias} -> ${b.path}`);
  }
  return lines.join("\n");
}

export function version(): string {
  return "1.3.0";
}

export function help(): string {
  const lines: string[] = [];
  lines.push("tp - Teleport to bookmarked directories\n");
  lines.push("Usage:");
  lines.push("  tp <alias>            Go to bookmarked directory");
  lines.push("  tp add <alias>        Bookmark current directory");
  lines.push("  tp del <alias>        Delete bookmark");
  lines.push("  tp ch <old> <new>     Rename alias (or merge if same path)");
  lines.push(
    "  tp gc                 Remove bookmarks for non-existent directories"
  );
  lines.push("  tp list               Show all bookmarks");
  lines.push("  tp help               Show this help");
  lines.push("  tp -v, --version      Show version");
  return lines.join("\n");
}

export function completions(dataFile: string): string {
  const bookmarks = loadBookmarks(dataFile);
  return bookmarks.map((b) => b.alias).join("\n");
}
