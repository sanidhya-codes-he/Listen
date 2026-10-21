# logging: one rotating file of ids, timings and errors; spoken words only after "debug on"
import logging
from logging.handlers import RotatingFileHandler
from pathlib import Path

LOG_FORMAT = "%(asctime)s %(levelname)-5s %(name)-8s %(message)s"
MAX_BYTES = 1_048_576  # 1 MB per file
BACKUP_COUNT = 5  # listen.log.1 ... listen.log.5, about 5 MB at most
HIDDEN = "[words hidden]"

# module-level flag: starts off at every process start, so "debug on" lasts until restart
_debug_words = False


def setup_logging(log_dir: Path) -> RotatingFileHandler:
    log_dir.mkdir(parents=True, exist_ok=True)
    handler = RotatingFileHandler(
        log_dir / "listen.log",
        maxBytes=MAX_BYTES,
        backupCount=BACKUP_COUNT,
        encoding="utf-8",
    )
    handler.setFormatter(logging.Formatter(LOG_FORMAT))
    root = logging.getLogger()
    root.setLevel(logging.INFO)
    root.addHandler(handler)
    return handler


def set_debug_words(on: bool) -> None:
    global _debug_words
    _debug_words = on


def words(text: str) -> str:
    """Wrap anything the owner said before logging it: hidden unless debug is on."""
    return repr(text) if _debug_words else HIDDEN
