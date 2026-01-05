# tp

> 🌍 [한국어](./docs/README.ko.md) | [日本語](./docs/README.ja.md) | [中文](./docs/README.zh.md)

Bookmark directories and teleport anywhere.

## Installation

```bash
npm install -g @fru1tworld/tp
```

Add the shell wrapper to your shell config:

```bash
# Add to ~/.zshrc or ~/.bashrc
tp() {
    local output
    output=$(tp-cli "$@")
    if [[ "$output" == __TP_CD__:* ]]; then
        cd "${output#__TP_CD__:}"
    else
        echo "$output"
    fi
}
```

Restart your terminal or run `source ~/.zshrc`.

## Usage

```bash
# Bookmark current directory
tp add work

# Teleport to bookmarked directory
tp work

# List all bookmarks (newest first)
tp list

# Delete bookmark
tp del work

# Help
tp help
```

## Example

```bash
cd ~/projects/my-app
tp add app          # Added: app -> /Users/me/projects/my-app

cd /
tp app              # Instantly teleport to ~/projects/my-app

tp list
# Bookmarks (newest first):
#   app             -> /Users/me/projects/my-app
```

## Data Location

`~/.tp/bookmarks.json`

## Requirements

- Node.js >= 16
- macOS / Linux (Bash or Zsh)

## License

MIT
