# tp

> 🌍 [English](../README.md) | [한국어](./README.ko.md) | [日本語](./README.ja.md)

收藏目录，随时随地瞬间移动。

## 安装

```bash
npm install -g @fru1tworld/tp
```

在shell配置文件中添加wrapper函数：

```bash
# 添加到 ~/.zshrc 或 ~/.bashrc
tp() {
    local output
    output=$(tp-cli "$@")
    if [[ "$output" == __TP_CD__:* ]]; then
        cd "${output#__TP_CD__:}"
    else
        echo "$output"
    fi
}

# Tab补全 (Zsh)
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

# Tab补全 (Bash)
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

重启终端或运行 `source ~/.zshrc`。

## Tab补全

设置完成后，按 `Tab` 键可自动补全：

```bash
tp <TAB>        # 显示: add, del, ch, gc, list, help + 所有已注册的alias
tp del <TAB>    # 显示: 仅已注册的alias
tp ch <TAB>     # 显示: 仅已注册的alias
tp wo<TAB>      # 补全为: tp work
```

## 使用方法

```bash
# 收藏当前目录
tp add work

# 跳转到收藏的目录
tp work

# 查看所有收藏（按最新排序）
tp list

# 删除收藏
tp del work

# 重命名别名
tp ch work project

# 清理指向不存在目录的收藏
tp gc

# 帮助
tp help
```

## 示例

```bash
cd ~/projects/my-app
tp add app          # Added: app -> /Users/me/projects/my-app

cd /
tp app              # 瞬间跳转到 ~/projects/my-app

tp list
# Bookmarks (newest first):
#   app             -> /Users/me/projects/my-app
```

## 数据存储位置

`~/.tp/bookmarks.json`

## 系统要求

- Node.js >= 16
- macOS / Linux (Bash 或 Zsh)

## 许可证

MIT
