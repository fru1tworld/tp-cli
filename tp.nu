# tp - Nushell wrapper for tp directory bookmarks
# Add to your config.nu (usually ~/.config/nushell/config.nu):
#   source /path/to/tp.nu
#
# To find the installed path:
#   npm root -g | str trim | path join "@fru1tworld/tp/tp.nu"

# Shell wrapper - uses --env so cd persists in the caller's environment
def --env tp [...args: string] {
    let output = (tp-cli ...$args | str trim)

    if ($output | str starts-with "__TP_CD__:") {
        let target = ($output | str substring 10..)
        cd $target
    } else {
        print $output
    }
}

# Tab completion: commands + aliases
def "nu-complete tp commands" [] {
    let commands = ["add", "del", "ch", "gc", "list", "help"]
    let aliases = (try { tp-cli --completions | lines | where {|it| ($it | str trim) != "" } } catch { [] })
    $commands | append $aliases
}

# Tab completion: aliases only (for del, ch)
def "nu-complete tp aliases" [] {
    try { tp-cli --completions | lines | where {|it| ($it | str trim) != "" } } catch { [] }
}
