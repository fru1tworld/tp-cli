# tp - Fish shell wrapper for tp directory bookmarks
# Add to your ~/.config/fish/config.fish:
#   tp-cli init fish | source

function tp
    set -l output (tp-cli $argv)

    if string match -q '__TP_CD__:*' -- $output
        set -l target (string replace '__TP_CD__:' '' -- $output)
        cd $target
    else
        echo $output
    end
end

complete -c tp -f

complete -c tp -n '__fish_use_subcommand' -a 'add' -d 'Bookmark current directory'
complete -c tp -n '__fish_use_subcommand' -a 'del' -d 'Delete bookmark'
complete -c tp -n '__fish_use_subcommand' -a 'ch' -d 'Rename alias'
complete -c tp -n '__fish_use_subcommand' -a 'gc' -d 'Clean invalid bookmarks'
complete -c tp -n '__fish_use_subcommand' -a 'list' -d 'Show all bookmarks'
complete -c tp -n '__fish_use_subcommand' -a 'help' -d 'Show help'

complete -c tp -n '__fish_use_subcommand' -a '(tp-cli --completions 2>/dev/null)'

complete -c tp -n '__fish_seen_subcommand_from del ch' -a '(tp-cli --completions 2>/dev/null)'

complete -c tp -n '__fish_seen_subcommand_from list' -s u -l utf8 -d 'Sort by alias (UTF-8 order)'
complete -c tp -n '__fish_seen_subcommand_from list' -s r -l recent -d 'Sort by newest first'
