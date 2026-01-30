# tp

> 🌍 [English](../README.md) | [한국어](./README.ko.md) | [中文](./README.zh.md)

ディレクトリをブックマークして、どこからでもテレポート。

## インストール

```bash
npm install -g @fru1tworld/tp
```

シェル設定ファイルにwrapper関数を追加してください：

```bash
# ~/.zshrc または ~/.bashrc に追加
tp() {
    local output
    output=$(tp-cli "$@")
    if [[ "$output" == __TP_CD__:* ]]; then
        cd "${output#__TP_CD__:}"
    else
        echo "$output"
    fi
}

# Tab補完 (Zsh)
_tp_completions_zsh() {
    local commands="add del ch gc list help"
    local aliases=$(tp-cli --completions 2>/dev/null)
    case "$words[2]" in
        del|ch) _values 'alias' ${(f)aliases} ;;
        add|gc|list|help) ;;
        *) _values 'command' $commands ${(f)aliases} ;;
    esac
}
compdef _tp_completions_zsh tp

# Tab補完 (Bash)
_tp_completions() {
    local cur="${COMP_WORDS[COMP_CWORD]}"
    local prev="${COMP_WORDS[COMP_CWORD-1]}"
    local commands="add del ch gc list help"
    case "$prev" in
        tp) COMPREPLY=($(compgen -W "$commands $(tp-cli --completions 2>/dev/null)" -- "$cur")) ;;
        del|ch) COMPREPLY=($(compgen -W "$(tp-cli --completions 2>/dev/null)" -- "$cur")) ;;
        *) COMPREPLY=() ;;
    esac
}
complete -F _tp_completions tp
```

ターミナルを再起動するか、`source ~/.zshrc`を実行してください。

### Nushell

`config.nu`（通常 `~/.config/nushell/config.nu`）に追加してください：

```nu
source /path/to/tp.nu
# npm install -g の場合：
# source (npm root -g | str trim | path join "@fru1tworld/tp" "tp.nu")
```

### Fish

`config.fish`（通常 `~/.config/fish/config.fish`）に追加してください：

```fish
source /path/to/tp.fish
# npm install -g の場合：
# source (npm root -g)/@fru1tworld/tp/tp.fish
```

## Tab補完

設定後、`Tab`キーで自動補完できます：

```bash
tp <TAB>        # 表示: add, del, ch, gc, list, help + 登録済みの全alias
tp del <TAB>    # 表示: 登録済みのaliasのみ
tp ch <TAB>     # 表示: 登録済みのaliasのみ
tp wo<TAB>      # 補完: tp work
```

## 使い方

```bash
# 現在のディレクトリをブックマーク
tp add work

# ブックマークしたディレクトリに移動
tp work

# すべてのブックマークを表示（新しい順）
tp list

# ブックマークを削除
tp del work

# エイリアス名を変更
tp ch work project

# 存在しないディレクトリのブックマークを整理
tp gc

# ヘルプ
tp help
```

## 例

```bash
cd ~/projects/my-app
tp add app          # Added: app -> /Users/me/projects/my-app

cd /
tp app              # ~/projects/my-appに瞬時に移動

tp list
# Bookmarks (newest first):
#   app             -> /Users/me/projects/my-app
```

## データ保存場所

`~/.tp/bookmarks.json`

## 必要条件

- Node.js >= 20
- macOS / Linux
- 対応シェル: Bash, Zsh, Fish, Nushell

## ライセンス

MIT
