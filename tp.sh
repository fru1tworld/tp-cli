# tp shell wrapper - add this to your .zshrc or .bashrc
# source this file or copy the function below

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

# Tab completion for tp
_tp_completions() {
    local cur="${COMP_WORDS[COMP_CWORD]}"
    local prev="${COMP_WORDS[COMP_CWORD-1]}"
    local commands="add del list help"

    case "$prev" in
        tp)
            # First argument: show commands + aliases
            local aliases=$(tp-cli --completions 2>/dev/null)
            COMPREPLY=($(compgen -W "$commands $aliases" -- "$cur"))
            ;;
        del)
            # After 'del': show only aliases
            local aliases=$(tp-cli --completions 2>/dev/null)
            COMPREPLY=($(compgen -W "$aliases" -- "$cur"))
            ;;
        add|list|help)
            # No completion after these
            COMPREPLY=()
            ;;
        *)
            COMPREPLY=()
            ;;
    esac
}

# Zsh completion
_tp_completions_zsh() {
    local commands="add del list help"
    local aliases=$(tp-cli --completions 2>/dev/null)

    case "$words[2]" in
        del)
            _values 'alias' ${(f)aliases}
            ;;
        add|list|help)
            ;;
        *)
            _values 'command' $commands ${(f)aliases}
            ;;
    esac
}

# Register completion based on shell
if [[ -n "$ZSH_VERSION" ]]; then
    compdef _tp_completions_zsh tp
elif [[ -n "$BASH_VERSION" ]]; then
    complete -F _tp_completions tp
fi
