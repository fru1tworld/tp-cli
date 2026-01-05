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
```

重启终端或运行 `source ~/.zshrc`。

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
