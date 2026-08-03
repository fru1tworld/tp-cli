import { execSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { CommandError } from "../commands.js";
import { main } from "../index.js";

let tmpDir: string;
let dataFile: string;
const cliPath = fileURLToPath(new URL("../../dist/index.js", import.meta.url));

function runCli(args: string): string {
  try {
    return execSync(`node ${cliPath} ${args}`, {
      encoding: "utf-8",
      env: { ...process.env, HOME: tmpDir, USERPROFILE: tmpDir },
      cwd: tmpDir,
    }).trim();
  } catch (err: unknown) {
    const e = err as { stdout?: string; stderr?: string };
    return (e.stdout ?? e.stderr ?? "").toString().trim();
  }
}

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "tp-cli-test-"));
  dataFile = path.join(tmpDir, "bookmarks.json");
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe("main() function", () => {
  it("routes help command", () => {
    const output = main(["help"], tmpDir, dataFile);
    expect(output).toContain("tp - Teleport to bookmarked directories");
  });

  it("routes -h flag", () => {
    const output = main(["-h"], tmpDir, dataFile);
    expect(output).toContain("tp - Teleport to bookmarked directories");
  });

  it("routes --help flag", () => {
    const output = main(["--help"], tmpDir, dataFile);
    expect(output).toContain("tp - Teleport to bookmarked directories");
  });

  it("routes -v flag", () => {
    expect(main(["-v"], tmpDir, dataFile)).toBe("2.0.0");
  });

  it("routes --version flag", () => {
    expect(main(["--version"], tmpDir, dataFile)).toBe("2.0.0");
  });

  it("routes list command", () => {
    const output = main(["list"], tmpDir, dataFile);
    expect(output).toContain("No bookmarks yet");
  });

  it("routes list -r to recent order", () => {
    main(["add", "zulu"], tmpDir, dataFile);
    const output = main(["list", "-r"], tmpDir, dataFile);
    expect(output).toContain("Bookmarks (newest first):");
  });

  it("rejects unknown list flag", () => {
    expect(() => main(["list", "--nope"], tmpDir, dataFile)).toThrow(
      "Usage: tp list",
    );
  });

  it("routes undefined (no args) to list", () => {
    const output = main([], tmpDir, dataFile);
    expect(output).toContain("No bookmarks yet");
  });

  it("routes add command", () => {
    const output = main(["add", "myalias"], tmpDir, dataFile);
    expect(output).toContain("Added: myalias");
  });

  it("routes del command", () => {
    main(["add", "todel"], tmpDir, dataFile);
    const output = main(["del", "todel"], tmpDir, dataFile);
    expect(output).toContain("Deleted: todel");
  });

  it("routes ch command", () => {
    main(["add", "old"], tmpDir, dataFile);
    const output = main(["ch", "old", "new"], tmpDir, dataFile);
    expect(output).toContain("Renamed: 'old' -> 'new'");
  });

  it("routes gc command", () => {
    const output = main(["gc"], tmpDir, dataFile);
    expect(output).toContain("No invalid bookmarks");
  });

  it("routes init command", () => {
    const output = main(["init", "zsh"], tmpDir, dataFile);
    expect(output).toContain("compdef _tp_completions_zsh tp");
  });

  it("rejects init without a shell", () => {
    expect(() => main(["init"], tmpDir, dataFile)).toThrow(
      "Usage: tp-cli init",
    );
  });

  it("routes --completions", () => {
    const output = main(["--completions"], tmpDir, dataFile);
    expect(output).toBe("");
  });

  it("routes default to go (alias lookup)", () => {
    main(["add", "here"], tmpDir, dataFile);
    const output = main(["here"], tmpDir, dataFile);
    expect(output).toBe(`__TP_CD__:${tmpDir}`);
  });

  it("matches alias case-insensitively by default", () => {
    main(["add", "rfc"], tmpDir, dataFile);
    expect(main(["RFC"], tmpDir, dataFile)).toBe(`__TP_CD__:${tmpDir}`);
    expect(main(["Rfc"], tmpDir, dataFile)).toBe(`__TP_CD__:${tmpDir}`);
  });

  it("respects caseSensitive config", () => {
    const config = { caseSensitive: true };
    main(["add", "rfc"], tmpDir, dataFile, config);
    expect(() => main(["RFC"], tmpDir, dataFile, config)).toThrow(CommandError);
  });

  it("throws CommandError for unknown alias", () => {
    expect(() => main(["nonexistent"], tmpDir, dataFile)).toThrow(CommandError);
  });
});

describe("CLI subprocess integration", () => {
  it("shows help with --help", () => {
    expect(runCli("--help")).toContain(
      "tp - Teleport to bookmarked directories",
    );
  });

  it("shows version with --version", () => {
    expect(runCli("--version")).toBe("2.0.0");
  });

  it("shows empty list", () => {
    expect(runCli("list")).toContain("No bookmarks yet");
  });

  it("adds and deletes a bookmark", () => {
    const addOut = runCli("add mydir");
    expect(addOut).toContain("Added: mydir");
    const delOut = runCli("del mydir");
    expect(delOut).toContain("Deleted: mydir");
  });

  it("handles error with exit code", () => {
    const output = runCli("nonexistent");
    expect(output).toContain("not found");
  });
});
