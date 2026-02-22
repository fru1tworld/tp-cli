# tp - Fish shell wrapper for tp directory bookmarks
# Add to your config.fish or source directly:
#   source /path/to/tp.fish
#
# Or copy the function to ~/.config/fish/functions/tp.fish
# and completions to ~/.config/fish/completions/tp.fish

# Shell wrapper function
function tp
    set -l output (tp-cli $argv)

    if string match -q '__TP_CD__:*' -- $output
        set -l target (string replace '__TP_CD__:' '' -- $output)
        cd $target
    else
        echo $output
    end
end

# Tab completion setup
# Disable file completions for tp
complete -c tp -f

# Subcommands (when no subcommand has been given yet)
complete -c tp -n '__fish_use_subcommand' -a 'add' -d 'Bookmark current directory'
complete -c tp -n '__fish_use_subcommand' -a 'del' -d 'Delete bookmark'
complete -c tp -n '__fish_use_subcommand' -a 'ch' -d 'Rename alias'
complete -c tp -n '__fish_use_subcommand' -a 'gc' -d 'Clean invalid bookmarks'
complete -c tp -n '__fish_use_subcommand' -a 'list' -d 'Show all bookmarks'
complete -c tp -n '__fish_use_subcommand' -a 'help' -d 'Show help'

# Dynamic alias completions (when no subcommand has been given)
complete -c tp -n '__fish_use_subcommand' -a '(tp-cli --completions 2>/dev/null)'

# Alias completions after del or ch
complete -c tp -n '__fish_seen_subcommand_from del ch' -a '(tp-cli --completions 2>/dev/null)'
