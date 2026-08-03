# tp - Nushell wrapper for tp directory bookmarks
# Nushell's `source` needs a parse-time constant path, so write the wrapper out first:
#   tp-cli init nu | save -f ~/.tp/tp.nu
# then add to your config.nu (usually ~/.config/nushell/config.nu):
#   source ~/.tp/tp.nu

def "nu-complete tp commands" [] {
    let commands = ["add", "del", "ch", "gc", "list", "help"]
    let aliases = (try { tp-cli --completions | lines | where {|it| ($it | str trim) != "" } } catch { [] })
    $commands | append $aliases
}

# --env is required so cd persists in the caller's environment
def --env tp [...args: string@"nu-complete tp commands"] {
    let output = (tp-cli ...$args | str trim)

    if ($output | str starts-with "__TP_CD__:") {
        let target = ($output | str substring 10..)
        cd $target
    } else {
        print $output
    }
}
