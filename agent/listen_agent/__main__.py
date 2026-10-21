# command line: "python -m listen_agent ..." or the installed "listen ..." command
import argparse
import sys

from listen_agent import __version__
from listen_agent.app import run_agent


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(prog="listen", description="Listen voice agent")
    parser.add_argument("--version", action="version", version=f"%(prog)s {__version__}")
    commands = parser.add_subparsers(dest="command", metavar="command")
    commands.add_parser("run", help="start the agent (Ctrl+C stops it)")
    return parser


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    if args.command == "run":
        return run_agent()
    parser.print_help()
    return 0


if __name__ == "__main__":
    sys.exit(main())
