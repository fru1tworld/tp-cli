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

# Tab 자동완성 (Zsh)
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

# Tab 자동완성 (Bash)
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

터미널을 재시작하거나 `source ~/.zshrc`를 실행하세요.

## Tab 자동완성

설정 후 `Tab` 키를 눌러 자동완성할 수 있습니다:

```bash
tp <TAB>        # 표시: add, del, ch, gc, list, help + 등록된 모든 alias
tp del <TAB>    # 표시: 등록된 alias만
tp ch <TAB>     # 표시: 등록된 alias만
tp wo<TAB>      # 완성: tp work
```

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

# 별칭 이름 변경
tp ch work project

# 존재하지 않는 디렉토리 북마크 정리
tp gc

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
