# tests for the log file and the spoken-words privacy rule
import logging
import re

import pytest

from listen_agent.core import logs
from listen_agent.core.logs import HIDDEN, setup_logging, words


@pytest.fixture
def log_file(tmp_path):
    handler = setup_logging(tmp_path / "logs")
    yield tmp_path / "logs" / "listen.log"
    logging.getLogger().removeHandler(handler)
    handler.close()


@pytest.fixture(autouse=True)
def words_hidden_again():
    yield
    logs.set_debug_words(False)


def test_creates_missing_log_folder_and_file(log_file):
    logging.getLogger("core").info("hello")
    assert log_file.exists()


def test_line_format_is_time_level_module_message(log_file):
    logging.getLogger("core").info("ready")
    line = log_file.read_text(encoding="utf-8").splitlines()[-1]
    assert re.fullmatch(r"\d{4}-\d\d-\d\d \d\d:\d\d:\d\d,\d{3} INFO  core     ready", line)


def test_debug_lines_are_not_written(log_file):
    logging.getLogger("core").debug("noise")
    assert "noise" not in log_file.read_text(encoding="utf-8")


def test_rotates_at_1_mb_keeping_5_old_files(tmp_path):
    handler = setup_logging(tmp_path)
    try:
        assert handler.maxBytes == 1_048_576
        assert handler.backupCount == 5
    finally:
        logging.getLogger().removeHandler(handler)
        handler.close()


def test_words_start_hidden():
    assert words("open vs code") == HIDDEN


def test_spoken_words_never_reach_the_log_by_default(log_file):
    logging.getLogger("intent").info("heard %s", words("search what is an atom"))
    text = log_file.read_text(encoding="utf-8")
    assert "atom" not in text
    assert HIDDEN in text


def test_debug_on_shows_words(log_file):
    logs.set_debug_words(True)
    logging.getLogger("intent").info("heard %s", words("open vs code"))
    assert "'open vs code'" in log_file.read_text(encoding="utf-8")
