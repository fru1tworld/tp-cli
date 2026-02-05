# tp

Bookmark directories and teleport anywhere.

## Installation

```bash
npm install -g @fru1tworld/tp
```

Add the shell wrapper to your shell config:

### Bash

Add to your `~/.bashrc`:

```bash
source /path/to/tp.bash
# Or after npm install -g:
# source "$(npm root -g)/@fru1tworld/tp/tp.bash"
```

### Zsh

Add to your `~/.zshrc`:

```zsh
source /path/to/tp.zsh
# Or after npm install -g:
# source "$(npm root -g)/@fru1tworld/tp/tp.zsh"
```

### Fish

Add to your `~/.config/fish/config.fish`:

```fish
source /path/to/tp.fish
# Or after npm install -g:
# source (npm root -g)/@fru1tworld/tp/tp.fish
```

### Nushell

Add to your `~/.config/nushell/config.nu`:

```nu
source /path/to/tp.nu
# Or after npm install -g:
# source (npm root -g | str trim | path join "@fru1tworld/tp" "tp.nu")
```

Restart your terminal or re-source your config file.

## Tab Completion

After setup, press `Tab` to autocomplete:

```bash
tp <TAB>        # Shows: add, del, ch, gc, list, help + all bookmarked aliases
tp del <TAB>    # Shows: bookmarked aliases only
tp ch <TAB>     # Shows: bookmarked aliases only
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

# Rename alias
tp ch work project

# Clean up bookmarks pointing to non-existent directories
tp gc

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

- Node.js >= 20
- macOS / Linux
- Supported shells: Bash, Zsh, Fish, Nushell

## License

MIT
