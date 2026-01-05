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
