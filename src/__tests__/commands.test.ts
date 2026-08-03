import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  add,
  type Bookmark,
  CommandError,
  ch,
  completions,
  del,
  gc,
  getConfigFile,
  getDataDir,
  getDataFile,
  go,
  help,
  init,
  list,
  loadBookmarks,
  loadConfig,
  parseListOrder,
  SUPPORTED_SHELLS,
  saveBookmarks,
  shellInit,
  type TpConfig,
  version,
} from "../commands.js";

let tmpDir: string;
let dataFile: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "tp-test-"));
  dataFile = path.join(tmpDir, "bookmarks.json");
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe("getDataDir", () => {
  it("returns ~/.tp", () => {
    expect(getDataDir()).toBe(path.join(os.homedir(), ".tp"));
  });
});

describe("getDataFile", () => {
  it("returns bookmarks.json in default data dir", () => {
    expect(getDataFile()).toBe(
      path.join(os.homedir(), ".tp", "bookmarks.json"),
    );
  });

  it("returns bookmarks.json in custom data dir", () => {
    expect(getDataFile("/custom")).toBe("/custom/bookmarks.json");
  });
});

describe("init", () => {
  it("creates directory and file when missing", () => {
    const nested = path.join(tmpDir, "sub", "bookmarks.json");
    init(nested);
    expect(fs.existsSync(path.join(tmpDir, "sub"))).toBe(true);
    expect(fs.existsSync(nested)).toBe(true);
    expect(fs.readFileSync(nested, "utf-8")).toBe("[]");
  });

  it("does nothing when directory and file already exist", () => {
    fs.writeFileSync(dataFile, '[{"alias":"x","path":"/x","createdAt":1}]');
    init(dataFile);
    expect(JSON.parse(fs.readFileSync(dataFile, "utf-8"))).toHaveLength(1);
  });
});

describe("loadBookmarks", () => {
  it("returns empty array for new file", () => {
    expect(loadBookmarks(dataFile)).toEqual([]);
  });

  it("returns bookmarks from existing file", () => {
    const bookmarks: Bookmark[] = [
      { alias: "test", path: "/tmp/test", createdAt: 1 },
    ];
    fs.writeFileSync(dataFile, JSON.stringify(bookmarks));
    expect(loadBookmarks(dataFile)).toEqual(bookmarks);
  });
});

describe("saveBookmarks", () => {
  it("writes bookmarks to file", () => {
    const bookmarks: Bookmark[] = [{ alias: "a", path: "/a", createdAt: 1 }];
    saveBookmarks(dataFile, bookmarks);
    const data = JSON.parse(fs.readFileSync(dataFile, "utf-8"));
    expect(data).toEqual(bookmarks);
  });
});

describe("add", () => {
  it("adds a new bookmark", () => {
    const result = add("proj", "/home/user/proj", dataFile);
    expect(result).toBe("Added: proj -> /home/user/proj");
    const bookmarks = loadBookmarks(dataFile);
    expect(bookmarks).toHaveLength(1);
    expect(bookmarks[0].alias).toBe("proj");
    expect(bookmarks[0].path).toBe("/home/user/proj");
  });

  it("throws on missing alias", () => {
    expect(() => add("", "/tmp", dataFile)).toThrow(CommandError);
    expect(() => add("", "/tmp", dataFile)).toThrow("Usage: tp add <alias>");
  });

  it("throws on duplicate alias", () => {
    add("dup", "/a", dataFile);
    expect(() => add("dup", "/b", dataFile)).toThrow(CommandError);
    expect(() => add("dup", "/b", dataFile)).toThrow("already exists");
  });

  it("throws on case-insensitive duplicate alias by default", () => {
    add("Work", "/a", dataFile);
    expect(() => add("work", "/b", dataFile)).toThrow("already exists");
    expect(() => add("WORK", "/c", dataFile)).toThrow("already exists");
  });

  it("allows case-different alias when caseSensitive is true", () => {
    const config: TpConfig = { caseSensitive: true };
    add("Work", "/a", dataFile, config);
    const result = add("work", "/b", dataFile, config);
    expect(result).toBe("Added: work -> /b");
  });

  it("throws on duplicate path", () => {
    add("first", "/same", dataFile);
    expect(() => add("second", "/same", dataFile)).toThrow(CommandError);
    expect(() => add("second", "/same", dataFile)).toThrow(
      "already registered",
    );
  });

  it("prepends new bookmarks (newest first)", () => {
    add("a", "/a", dataFile);
    add("b", "/b", dataFile);
    const bookmarks = loadBookmarks(dataFile);
    expect(bookmarks[0].alias).toBe("b");
    expect(bookmarks[1].alias).toBe("a");
  });
});

describe("del", () => {
  it("deletes a bookmark", () => {
    add("target", "/target", dataFile);
    const result = del("target", dataFile);
    expect(result).toBe("Deleted: target");
    expect(loadBookmarks(dataFile)).toHaveLength(0);
  });

  it("throws on missing alias", () => {
    expect(() => del("", dataFile)).toThrow(CommandError);
    expect(() => del("", dataFile)).toThrow("Usage: tp del <alias>");
  });

  it("throws on not found", () => {
    expect(() => del("nope", dataFile)).toThrow(CommandError);
    expect(() => del("nope", dataFile)).toThrow("not found");
  });

  it("deletes by case-insensitive alias by default", () => {
    add("Work", "/work", dataFile);
    const result = del("work", dataFile);
    expect(result).toBe("Deleted: work");
    expect(loadBookmarks(dataFile)).toHaveLength(0);
  });

  it("does not match case-different alias when caseSensitive is true", () => {
    const config: TpConfig = { caseSensitive: true };
    add("Work", "/work", dataFile, config);
    expect(() => del("work", dataFile, config)).toThrow("not found");
  });
});

describe("gc", () => {
  it("reports no invalid bookmarks when all valid", () => {
    add("tmp", tmpDir, dataFile);
    const result = gc(dataFile);
    expect(result).toBe("No invalid bookmarks found. All directories exist.");
  });

  it("removes invalid bookmarks", () => {
    const bookmarks: Bookmark[] = [
      { alias: "valid", path: tmpDir, createdAt: 1 },
      { alias: "invalid", path: "/nonexistent/path/xyz", createdAt: 2 },
    ];
    saveBookmarks(dataFile, bookmarks);

    const result = gc(dataFile);
    expect(result).toContain("Found 1 invalid bookmark(s):");
    expect(result).toContain("invalid");
    expect(result).toContain("Removed 1 invalid bookmark(s).");
    expect(loadBookmarks(dataFile)).toHaveLength(1);
    expect(loadBookmarks(dataFile)[0].alias).toBe("valid");
  });

  it("handles empty bookmarks", () => {
    const result = gc(dataFile);
    expect(result).toBe("No invalid bookmarks found. All directories exist.");
  });
});

describe("ch", () => {
  it("renames an alias", () => {
    add("old", "/old", dataFile);
    const result = ch("old", "new", dataFile);
    expect(result).toBe("Renamed: 'old' -> 'new'");
    const bookmarks = loadBookmarks(dataFile);
    expect(bookmarks[0].alias).toBe("new");
  });

  it("throws on missing old alias param", () => {
    expect(() => ch("", "new", dataFile)).toThrow(CommandError);
    expect(() => ch("", "new", dataFile)).toThrow("Usage: tp ch");
  });

  it("throws on missing new alias param", () => {
    expect(() => ch("old", "", dataFile)).toThrow(CommandError);
    expect(() => ch("old", "", dataFile)).toThrow("Usage: tp ch");
  });

  it("throws when old and new are the same", () => {
    expect(() => ch("same", "same", dataFile)).toThrow(CommandError);
    expect(() => ch("same", "same", dataFile)).toThrow("are the same");
  });

  it("throws when old alias not found", () => {
    expect(() => ch("missing", "new", dataFile)).toThrow(CommandError);
    expect(() => ch("missing", "new", dataFile)).toThrow("not found");
  });

  it("throws when new alias exists with different path", () => {
    add("a", "/a", dataFile);
    add("b", "/b", dataFile);
    expect(() => ch("a", "b", dataFile)).toThrow(CommandError);
    expect(() => ch("a", "b", dataFile)).toThrow(
      "already exists with a different path",
    );
  });

  it("renames by case-insensitive alias by default", () => {
    add("Work", "/work", dataFile);
    const result = ch("work", "project", dataFile);
    expect(result).toBe("Renamed: 'work' -> 'project'");
    expect(loadBookmarks(dataFile)[0].alias).toBe("project");
  });

  it("treats case-different old and new as same by default", () => {
    expect(() => ch("work", "Work", dataFile)).toThrow("are the same");
  });

  it("merges when new alias exists with same path", () => {
    const bookmarks: Bookmark[] = [
      { alias: "a", path: "/same", createdAt: 1 },
      { alias: "b", path: "/same", createdAt: 2 },
    ];
    saveBookmarks(dataFile, bookmarks);

    const result = ch("a", "b", dataFile);
    expect(result).toContain("point to the same directory");
    expect(result).toContain("Removed duplicate alias 'a'");
    expect(result).toContain("Keeping 'b'");
    expect(loadBookmarks(dataFile)).toHaveLength(1);
    expect(loadBookmarks(dataFile)[0].alias).toBe("b");
  });
});

describe("go", () => {
  it("returns __TP_CD__ protocol for valid alias", () => {
    add("here", tmpDir, dataFile);
    const result = go("here", dataFile);
    expect(result).toBe(`__TP_CD__:${tmpDir}`);
  });

  it("throws on missing alias", () => {
    expect(() => go("", dataFile)).toThrow(CommandError);
    expect(() => go("", dataFile)).toThrow("Usage: tp <alias>");
  });

  it("throws when alias not found", () => {
    expect(() => go("nope", dataFile)).toThrow(CommandError);
    expect(() => go("nope", dataFile)).toThrow("not found");
  });

  it("matches case-insensitive alias by default", () => {
    add("rfc", tmpDir, dataFile);
    expect(go("RFC", dataFile)).toBe(`__TP_CD__:${tmpDir}`);
    expect(go("Rfc", dataFile)).toBe(`__TP_CD__:${tmpDir}`);
  });

  it("does not match case-different alias when caseSensitive is true", () => {
    const config: TpConfig = { caseSensitive: true };
    add("rfc", tmpDir, dataFile, config);
    expect(() => go("RFC", dataFile, config)).toThrow("not found");
  });

  it("throws when directory no longer exists", () => {
    const bookmarks: Bookmark[] = [
      { alias: "gone", path: "/nonexistent/dir/xyz", createdAt: 1 },
    ];
    saveBookmarks(dataFile, bookmarks);
    expect(() => go("gone", dataFile)).toThrow(CommandError);
    expect(() => go("gone", dataFile)).toThrow("no longer exists");
  });
});

describe("list", () => {
  it("shows message when no bookmarks", () => {
    const result = list(dataFile);
    expect(result).toBe("No bookmarks yet. Use 'tp add <alias>' to add one.");
  });

  it("lists bookmarks in UTF-8 byte order by default", () => {
    add("beta", "/b", dataFile);
    add("alpha", "/a", dataFile);
    const result = list(dataFile);
    expect(result).toContain("Bookmarks (UTF-8 order):");
    expect(result.indexOf("alpha")).toBeLessThan(result.indexOf("beta"));
  });

  it("sorts uppercase before lowercase and ASCII before Hangul", () => {
    add("Zebra", "/Z", dataFile);
    add("apple", "/a", dataFile);
    add("가나", "/ga", dataFile);
    const result = list(dataFile);
    expect(result.indexOf("Zebra")).toBeLessThan(result.indexOf("apple"));
    expect(result.indexOf("apple")).toBeLessThan(result.indexOf("가나"));
  });

  it("lists bookmarks newest first when order is recent", () => {
    add("alpha", "/a", dataFile);
    add("beta", "/b", dataFile);
    const result = list(dataFile, "recent");
    expect(result).toContain("Bookmarks (newest first):");
    expect(result.indexOf("beta")).toBeLessThan(result.indexOf("alpha"));
  });

  it("keeps stored order untouched when sorting", () => {
    add("beta", "/b", dataFile);
    add("alpha", "/a", dataFile);
    list(dataFile);
    expect(loadBookmarks(dataFile).map((b) => b.alias)).toEqual([
      "alpha",
      "beta",
    ]);
  });
});

describe("parseListOrder", () => {
  it("defaults to utf8", () => {
    expect(parseListOrder(undefined)).toBe("utf8");
  });

  it("accepts recent flags", () => {
    expect(parseListOrder("-r")).toBe("recent");
    expect(parseListOrder("--recent")).toBe("recent");
  });

  it("accepts utf8 flags", () => {
    expect(parseListOrder("-u")).toBe("utf8");
    expect(parseListOrder("--utf8")).toBe("utf8");
  });

  it("throws on unknown flag", () => {
    expect(() => parseListOrder("--nope")).toThrow(CommandError);
  });
});

describe("version", () => {
  it("returns version string", () => {
    expect(version()).toBe("2.0.0");
  });
});

describe("help", () => {
  it("returns help text", () => {
    const result = help();
    expect(result).toContain("tp - Teleport to bookmarked directories");
    expect(result).toContain("tp <alias>");
    expect(result).toContain("tp add <alias>");
    expect(result).toContain("tp del <alias>");
    expect(result).toContain("tp ch <old> <new>");
    expect(result).toContain("tp gc");
    expect(result).toContain("tp list");
    expect(result).toContain("tp list -r");
    expect(result).toContain("tp help");
    expect(result).toContain("tp -v, --version");
  });
});

describe("shellInit", () => {
  it("prints the wrapper for every supported shell", () => {
    for (const shell of SUPPORTED_SHELLS) {
      expect(shellInit(shell)).toContain("tp-cli");
      expect(shellInit(shell)).toContain("__TP_CD__:");
    }
  });

  it("matches the shipped shell file", () => {
    const shipped = fs.readFileSync(
      path.join(fileURLToPath(new URL("../..", import.meta.url)), "tp.zsh"),
      "utf-8",
    );
    expect(shellInit("zsh")).toBe(shipped.trimEnd());
  });

  it("throws when shell is missing", () => {
    expect(() => shellInit(undefined)).toThrow(CommandError);
    expect(() => shellInit(undefined)).toThrow("Usage: tp-cli init");
  });

  it("throws on unsupported shell", () => {
    expect(() => shellInit("powershell")).toThrow(CommandError);
    expect(() => shellInit("powershell")).toThrow("bash|zsh|fish|nu");
  });
});

describe("completions", () => {
  it("returns empty string when no bookmarks", () => {
    const result = completions(dataFile);
    expect(result).toBe("");
  });

  it("returns alias list", () => {
    add("alpha", "/alpha", dataFile);
    add("beta", "/beta", dataFile);
    const result = completions(dataFile);
    expect(result).toBe("beta\nalpha");
  });
});

describe("getConfigFile", () => {
  it("returns config.json in default data dir", () => {
    expect(getConfigFile()).toBe(path.join(os.homedir(), ".tp", "config.json"));
  });

  it("returns config.json in custom data dir", () => {
    expect(getConfigFile("/custom")).toBe("/custom/config.json");
  });
});

describe("loadConfig", () => {
  it("returns empty object when file does not exist", () => {
    expect(loadConfig(path.join(tmpDir, "nonexistent.json"))).toEqual({});
  });

  it("returns parsed config from file", () => {
    const configFile = path.join(tmpDir, "config.json");
    fs.writeFileSync(configFile, JSON.stringify({ caseSensitive: true }));
    expect(loadConfig(configFile)).toEqual({ caseSensitive: true });
  });

  it("throws for invalid JSON", () => {
    const configFile = path.join(tmpDir, "config.json");
    fs.writeFileSync(configFile, "not json");
    expect(() => loadConfig(configFile)).toThrow(CommandError);
    expect(() => loadConfig(configFile)).toThrow("Invalid JSON in config file");
  });
});
