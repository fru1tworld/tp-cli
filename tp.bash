# tp - Bash shell wrapper for tp directory bookmarks
# Add to your ~/.bashrc:
#   source /path/to/tp.bash
#
# Or after npm install -g:
#   source "$(npm root -g)/@fru1tworld/tp/tp.bash"

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
_tp_completions() {
    local cur="${COMP_WORDS[COMP_CWORD]}"
    local prev="${COMP_WORDS[COMP_CWORD-1]}"
    local commands="add del ch gc list help"

    case "$prev" in
        tp)
            # First argument: show commands + aliases
            local aliases=$(tp-cli --completions 2>/dev/null)
            COMPREPLY=($(compgen -W "$commands $aliases" -- "$cur"))
            ;;
        del|ch)
            # After 'del' or 'ch': show only aliases
            local aliases=$(tp-cli --completions 2>/dev/null)
            COMPREPLY=($(compgen -W "$aliases" -- "$cur"))
            ;;
        add|gc|list|help)
            # No completion after these
            COMPREPLY=()
            ;;
        *)
            COMPREPLY=()
            ;;
    esac
}

complete -F _tp_completions tp
