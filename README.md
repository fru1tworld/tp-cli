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

# Tab completion (Zsh)
_tp_completions_zsh() {
    local commands="add del list help"
    local aliases=$(tp-cli --completions 2>/dev/null)
    case "$words[2]" in
        del) _values 'alias' ${(f)aliases} ;;
        add|list|help) ;;
        *) _values 'command' $commands ${(f)aliases} ;;
    esac
}
compdef _tp_completions_zsh tp

# Tab completion (Bash)
_tp_completions() {
    local cur="${COMP_WORDS[COMP_CWORD]}"
    local prev="${COMP_WORDS[COMP_CWORD-1]}"
    local commands="add del list help"
    case "$prev" in
        tp) COMPREPLY=($(compgen -W "$commands $(tp-cli --completions 2>/dev/null)" -- "$cur")) ;;
        del) COMPREPLY=($(compgen -W "$(tp-cli --completions 2>/dev/null)" -- "$cur")) ;;
        *) COMPREPLY=() ;;
    esac
}
complete -F _tp_completions tp
```

Restart your terminal or run `source ~/.zshrc`.

## Tab Completion

After setup, press `Tab` to autocomplete:

```bash
tp <TAB>        # Shows: add, del, list, help + all bookmarked aliases
tp del <TAB>    # Shows: bookmarked aliases only
tp wo<TAB>      # Completes to: tp work
```

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
