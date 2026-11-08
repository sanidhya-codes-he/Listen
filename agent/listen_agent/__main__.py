# command line: "python -m listen_agent ..." or the installed "listen ..." command
import argparse
import sys

from listen_agent import __version__
from listen_agent.app import run_agent
from listen_agent.core.paths import COMMANDS_DIR
from listen_agent.intent.library import check_commands


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(prog="listen", description="Listen voice agent")
    parser.add_argument("--version", action="version", version=f"%(prog)s {__version__}")
    # without a subcommand, the deepest parser named prints its own help
    parser.set_defaults(show_help=parser.print_help)
    commands = parser.add_subparsers(dest="command", metavar="command")
    commands.add_parser("run", help="start the agent (Ctrl+C stops it)")
    files = commands.add_parser("commands", help="work with the command files in commands/")
    files.set_defaults(show_help=files.print_help)
    files_actions = files.add_subparsers(dest="action", metavar="action")
    files_actions.add_parser("check", help="check every command file; exit 1 if any has problems")
    return parser


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    if args.command == "run":
        return run_agent()
    if args.command == "commands" and args.action == "check":
        return check_commands(COMMANDS_DIR)
    args.show_help()
    return 0


if __name__ == "__main__":
    sys.exit(main())
