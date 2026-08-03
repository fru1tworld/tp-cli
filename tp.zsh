# tp - Zsh shell wrapper for tp directory bookmarks
# Add to your ~/.zshrc, after compinit:
#   eval "$(tp-cli init zsh)"

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

_tp_completions_zsh() {
    local commands="add del ch gc list help"
    local aliases=$(tp-cli --completions 2>/dev/null)

    case "$words[2]" in
        del|ch)
            _values 'alias' ${(f)aliases}
            ;;
        list)
            _values 'order' -u --utf8 -r --recent
            ;;
        add|gc|help)
            ;;
        *)
            _values 'command' $commands ${(f)aliases}
            ;;
    esac
}

# compdef does not exist until compinit has run
(( $+functions[compdef] )) && compdef _tp_completions_zsh tp
