# tp

> 🌍 [English](../README.md) | [日本語](./README.ja.md) | [中文](./README.zh.md)

디렉토리를 북마크하고 어디서든 순간이동하세요.

## 설치

```bash
npm install -g @fru1tworld/tp
```

쉘 설정 파일에 wrapper 함수를 추가하세요:

```bash
# ~/.zshrc 또는 ~/.bashrc에 추가
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

터미널을 재시작하거나 `source ~/.zshrc`를 실행하세요.

## 사용법

```bash
# 현재 디렉토리를 북마크
tp add work

# 북마크한 디렉토리로 이동
tp work

# 모든 북마크 보기 (최신순)
tp list

# 북마크 삭제
tp del work

# 도움말
tp help
```

## 예시

```bash
cd ~/projects/my-app
tp add app          # Added: app -> /Users/me/projects/my-app

cd /
tp app              # 바로 ~/projects/my-app으로 이동

tp list
# Bookmarks (newest first):
#   app             -> /Users/me/projects/my-app
```

## 데이터 저장 위치

`~/.tp/bookmarks.json`

## 요구사항

- Node.js >= 16
- macOS / Linux (Bash 또는 Zsh)

## 라이센스

MIT
