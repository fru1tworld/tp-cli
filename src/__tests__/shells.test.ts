import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

const root = path.resolve(__dirname, "../..");

describe("Shell integration files", () => {
  describe("tp.sh (Bash/Zsh)", () => {
    const filePath = path.join(root, "tp.sh");

    it("exists", () => {
      expect(fs.existsSync(filePath)).toBe(true);
    });

    it("contains tp wrapper function", () => {
      const content = fs.readFileSync(filePath, "utf-8");
      expect(content).toContain("tp()");
      expect(content).toContain("tp-cli");
      expect(content).toContain("__TP_CD__:");
      expect(content).toContain('cd "');
    });

    it("contains Bash completion function", () => {
      const content = fs.readFileSync(filePath, "utf-8");
      expect(content).toContain("_tp_completions()");
      expect(content).toContain("COMP_WORDS");
      expect(content).toContain("COMPREPLY");
      expect(content).toContain("--completions");
    });

    it("contains Zsh completion function", () => {
      const content = fs.readFileSync(filePath, "utf-8");
      expect(content).toContain("_tp_completions_zsh()");
      expect(content).toContain("_values");
      expect(content).toContain("compdef");
    });

    it("detects shell type for completion registration", () => {
      const content = fs.readFileSync(filePath, "utf-8");
      expect(content).toContain("ZSH_VERSION");
      expect(content).toContain("BASH_VERSION");
    });
  });

  describe("tp.nu (Nushell)", () => {
    const filePath = path.join(root, "tp.nu");

    it("exists", () => {
      expect(fs.existsSync(filePath)).toBe(true);
    });

    it("contains tp wrapper function with --env", () => {
      const content = fs.readFileSync(filePath, "utf-8");
      expect(content).toContain("def --env tp");
      expect(content).toContain("tp-cli");
      expect(content).toContain("__TP_CD__:");
      expect(content).toContain("str starts-with");
      expect(content).toContain("str substring");
      expect(content).toContain("cd");
    });

    it("contains completion functions", () => {
      const content = fs.readFileSync(filePath, "utf-8");
      expect(content).toContain("nu-complete tp commands");
      expect(content).toContain("nu-complete tp aliases");
      expect(content).toContain("--completions");
    });

    it("includes all tp subcommands", () => {
      const content = fs.readFileSync(filePath, "utf-8");
      const commands = ["add", "del", "ch", "gc", "list", "help"];
      for (const cmd of commands) {
        expect(content).toContain(`"${cmd}"`);
      }
    });
  });

  describe("tp.fish (Fish)", () => {
    const filePath = path.join(root, "tp.fish");

    it("exists", () => {
      expect(fs.existsSync(filePath)).toBe(true);
    });

    it("contains tp wrapper function", () => {
      const content = fs.readFileSync(filePath, "utf-8");
      expect(content).toContain("function tp");
      expect(content).toContain("tp-cli");
      expect(content).toContain("__TP_CD__:");
      expect(content).toContain("string match");
      expect(content).toContain("string replace");
      expect(content).toContain("cd");
    });

    it("contains completion setup", () => {
      const content = fs.readFileSync(filePath, "utf-8");
      expect(content).toContain("complete -c tp");
      expect(content).toContain("__fish_use_subcommand");
      expect(content).toContain("--completions");
    });

    it("registers all tp subcommands", () => {
      const content = fs.readFileSync(filePath, "utf-8");
      const commands = ["add", "del", "ch", "gc", "list", "help"];
      for (const cmd of commands) {
        expect(content).toContain(cmd);
      }
    });

    it("provides alias completion for del and ch", () => {
      const content = fs.readFileSync(filePath, "utf-8");
      expect(content).toContain("__fish_seen_subcommand_from del ch");
    });
  });
});
