# tp

> 🌍 [English](./README.md) | [한국어](./README.ko.md) | [中文](./README.zh.md)

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
```

ターミナルを再起動するか、`source ~/.zshrc`を実行してください。

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

- Node.js >= 16
- macOS / Linux (Bash または Zsh)

## ライセンス

MIT
