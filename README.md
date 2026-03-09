# tp

디렉토리를 북마크하고 순간이동하는 CLI 도구

## Tech Stack

`TypeScript` `Node.js` `Vitest` `Biome`

## 설치

```bash
npm install -g @fru1tworld/tp
```

쉘 설정 파일에 wrapper 추가:

```bash
# Bash (~/.bashrc)
source "$(npm root -g)/@fru1tworld/tp/tp.bash"

# Zsh (~/.zshrc)
source "$(npm root -g)/@fru1tworld/tp/tp.zsh"

# Fish (~/.config/fish/config.fish)
source (npm root -g)/@fru1tworld/tp/tp.fish

# Nushell (~/.config/nushell/config.nu)
source (npm root -g | str trim | path join "@fru1tworld/tp" "tp.nu")
```

설정 후 터미널 재시작

## 사용법

```bash
tp add <alias>      # 현재 디렉토리 북마크
tp <alias>          # 북마크한 디렉토리로 이동
tp list             # 북마크 목록 (최신순)
tp del <alias>      # 북마크 삭제
tp ch <old> <new>   # 별칭 변경
tp gc               # 존재하지 않는 경로 정리
tp help             # 도움말
```

## 탭 자동완성

```bash
tp <TAB>        # 명령어 + 북마크 목록
tp del <TAB>    # 북마크 목록
```

## 예시

```bash
cd ~/projects/my-app
tp add app          # Added: app -> /Users/me/projects/my-app

cd /
tp app              # ~/projects/my-app으로 이동
```

## 데이터 저장 위치

~/.tp/bookmarks.json

## 요구사항

- Node.js >= 20
- macOS / Linux
- 지원 쉘: Bash, Zsh, Fish, Nushell

## 라이선스

MIT
