# tp - Bash shell wrapper for tp directory bookmarks
# Add to your ~/.bashrc:
#   eval "$(tp-cli init bash)"

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

_tp_completions() {
    local cur="${COMP_WORDS[COMP_CWORD]}"
    local prev="${COMP_WORDS[COMP_CWORD-1]}"
    local commands="add del ch gc list help"

    case "$prev" in
        tp)
            local aliases=$(tp-cli --completions 2>/dev/null)
            COMPREPLY=($(compgen -W "$commands $aliases" -- "$cur"))
            ;;
        del|ch)
            local aliases=$(tp-cli --completions 2>/dev/null)
            COMPREPLY=($(compgen -W "$aliases" -- "$cur"))
            ;;
        list)
            COMPREPLY=($(compgen -W "-u --utf8 -r --recent" -- "$cur"))
            ;;
        *)
            COMPREPLY=()
            ;;
    esac
}

complete -F _tp_completions tp
