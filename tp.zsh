# tp - Zsh shell wrapper for tp directory bookmarks
# Add to your ~/.zshrc:
#   source /path/to/tp.zsh
#
# Or after npm install -g:
#   source "$(npm root -g)/@fru1tworld/tp/tp.zsh"

# Shell wrapper function
tp() {
    local output
    output=$(tp-cli "$@")

    if [[ "$output" == __TP_CD__:* ]]; then
        local target="${output#__TP_CD__:}"
        cd "$target"
    else
        echo "$output"
    fi
}

# Tab completion
_tp_completions_zsh() {
    local commands="add del ch gc list help"
    local aliases=$(tp-cli --completions 2>/dev/null)

    case "$words[2]" in
        del|ch)
            _values 'alias' ${(f)aliases}
            ;;
        add|gc|list|help)
            ;;
        *)
            _values 'command' $commands ${(f)aliases}
            ;;
    esac
}

compdef _tp_completions_zsh tp
