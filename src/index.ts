#!/usr/bin/env node

import * as fs from "fs";
import * as path from "path";
import * as os from "os";

interface Bookmark {
  alias: string;
  path: string;
  createdAt: number;
}

const DATA_DIR = path.join(os.homedir(), ".tp");
const DATA_FILE = path.join(DATA_DIR, "bookmarks.json");

function init(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, "[]");
  }
}

function loadBookmarks(): Bookmark[] {
  init();
  const data = fs.readFileSync(DATA_FILE, "utf-8");
  return JSON.parse(data);
}

function saveBookmarks(bookmarks: Bookmark[]): void {
  fs.writeFileSync(DATA_FILE, JSON.stringify(bookmarks, null, 2));
}

function add(alias: string): void {
  if (!alias) {
    console.log("Usage: tp add <alias>");
    process.exit(1);
  }

  const currentPath = process.cwd();
  const bookmarks = loadBookmarks();

  const existingAlias = bookmarks.find((b) => b.alias === alias);
  if (existingAlias) {
    console.log(`Alias '${alias}' already exists. Use 'tp del ${alias}' first.`);
    process.exit(1);
  }

  const existingPath = bookmarks.find((b) => b.path === currentPath);
  if (existingPath) {
    console.log(`This path is already registered as '${existingPath.alias}'.`);
    process.exit(1);
  }

  bookmarks.unshift({
    alias,
    path: currentPath,
    createdAt: Date.now(),
  });

  saveBookmarks(bookmarks);
  console.log(`Added: ${alias} -> ${currentPath}`);
}

function del(alias: string): void {
  if (!alias) {
    console.log("Usage: tp del <alias>");
    process.exit(1);
  }

  const bookmarks = loadBookmarks();
  const index = bookmarks.findIndex((b) => b.alias === alias);

  if (index === -1) {
    console.log(`Alias '${alias}' not found.`);
    process.exit(1);
  }

  bookmarks.splice(index, 1);
  saveBookmarks(bookmarks);
  console.log(`Deleted: ${alias}`);
}

function go(alias: string): void {
  if (!alias) {
    console.log("Usage: tp <alias>");
    process.exit(1);
  }

  const bookmarks = loadBookmarks();
  const bookmark = bookmarks.find((b) => b.alias === alias);

  if (!bookmark) {
    console.log(`Alias '${alias}' not found.`);
    process.exit(1);
  }

  if (!fs.existsSync(bookmark.path)) {
    console.log(`Directory no longer exists: ${bookmark.path}`);
    process.exit(1);
  }

  // Output path for shell wrapper to cd
  console.log(`__TP_CD__:${bookmark.path}`);
}

function list(): void {
  const bookmarks = loadBookmarks();

  if (bookmarks.length === 0) {
    console.log("No bookmarks yet. Use 'tp add <alias>' to add one.");
    return;
  }

  console.log("Bookmarks (newest first):\n");
  for (const b of bookmarks) {
    const alias = b.alias.padEnd(15);
    console.log(`  ${alias} -> ${b.path}`);
  }
}

function help(): void {
  console.log("tp - Teleport to bookmarked directories\n");
  console.log("Usage:");
  console.log("  tp <alias>        Go to bookmarked directory");
  console.log("  tp add <alias>    Bookmark current directory");
  console.log("  tp del <alias>    Delete bookmark");
  console.log("  tp list           Show all bookmarks");
  console.log("  tp help           Show this help");
}

function main(): void {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case "add":
      add(args[1]);
      break;
    case "del":
      del(args[1]);
      break;
    case "list":
      list();
      break;
    case "help":
    case "-h":
    case "--help":
      help();
      break;
    case undefined:
      list();
      break;
    default:
      go(command);
      break;
  }
}

main();
