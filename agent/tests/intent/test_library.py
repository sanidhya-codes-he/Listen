# tests for the command library: commands/*.yaml -> checked, merged commands, reloaded on change
import logging

import pytest

from listen_agent.intent.library import CommandFiles

SEARCH = """\
version: 1
targets:
  google: {search: "https://www.google.com/search?q={query}", home: "https://www.google.com"}
defaults:
  search: google
aliases:
  chrome: Google Chrome
commands:
  - id: search
    patterns: ["search {query} on {target}", "search {query}"]
    action: open_url
    url_from: search
"""


def write(folder, name, text):
    path = folder / name
    path.write_text(text, encoding="utf-8")
    return path


def command_file(*entries):
    # a file holding only the given command entries, each written as YAML lines
    return "commands:\n" + "".join(entries)


GOOD = "  - id: hello\n    patterns: [hello]\n    action: toggle_mute\n"


def ids(files):
    return [command.id for command in files.library.commands]


def test_a_valid_file_loads_every_section(tmp_path):
    write(tmp_path, "core.yaml", SEARCH)
    library = CommandFiles(tmp_path).library
    assert library.targets["google"]["home"] == "https://www.google.com"
    assert library.defaults == {"search": "google"}
    assert library.aliases == {"chrome": "Google Chrome"}
    [search] = library.commands
    assert (search.file, search.line, search.id) == ("core.yaml", 9, "search")
    assert search.patterns == ("search {query} on {target}", "search {query}")
    assert (search.action, search.url_from, search.params) == ("open_url", "search", {})
    assert library.problems == ()


def test_unset_fields_get_their_defaults(tmp_path):
    write(tmp_path, "core.yaml", command_file(GOOD))
    [hello] = CommandFiles(tmp_path).library.commands
    assert (hello.risk, hello.continuous, hello.focus_first, hello.when_app) == (
        "low", "allow", False, None)


def test_close_app_asks_first_in_continuous_mode_but_routines_do_not(tmp_path):
    # spec §3.7: close_app commands default to confirm; routines run immediately
    write(tmp_path, "core.yaml", command_file(
        "  - id: close\n    patterns: ['close {app}']\n    action: close_app\n",
        "  - id: tidy\n    patterns: [tidy up]\n",
        "    steps: [{action: close_app, params: {app: x}}]\n"))
    close, tidy = CommandFiles(tmp_path).library.commands
    assert (close.continuous, tidy.continuous) == ("confirm", "allow")
    assert (close.risk, tidy.risk) == ("high", "low")  # spec §3.6: closing an app is high risk
    assert tidy.steps == ({"action": "close_app", "params": {"app": "x"}},)


def test_any_high_risk_command_asks_first_in_continuous_mode(tmp_path):
    # owner, 2026-11-12: confirmation follows risk, so a new risky command is only YAML
    write(tmp_path, "core.yaml", command_file(
        "  - id: wipe\n    patterns: [wipe]\n    action: toggle_mute\n    risk: high\n",
        "  - id: tidy\n    patterns: [tidy]\n    steps: [{action: toggle_mute}]\n    risk: high\n",
        "  - id: open\n    patterns: ['close {app}']\n    action: close_app\n    risk: low\n"))
    wipe, tidy, open_ = CommandFiles(tmp_path).library.commands
    assert (wipe.continuous, tidy.continuous) == ("confirm", "confirm")
    assert open_.continuous == "allow"  # close_app made low risk no longer asks


def test_a_file_overrides_the_action_defaults(tmp_path):
    write(tmp_path, "core.yaml", command_file(
        "  - id: close\n    patterns: ['close {app}']\n    action: close_app\n",
        "    risk: low\n    continuous: allow\n"))
    [close] = CommandFiles(tmp_path).library.commands
    assert (close.risk, close.continuous) == ("low", "allow")


BROKEN = {
    "unknown key": ("    acton: open_url\n", "unknown key 'acton'"),
    "bad risk": ("    action: toggle_mute\n    risk: hgh\n", "risk: 'hgh' is not one of"),
    "unknown action": ("    action: run_program\n", "'run_program' is not an allowed action"),
    "bad slot": ("    action: toggle_mute\n    when_app: x\n    patterns: ['say {thing}']\n",
                 "a slot must be {query}, {target}, {app} or {number}"),
    "press_keys without when_app": ("    action: press_keys\n", "press_keys needs 'when_app'"),
    "press_keys step without when_app": ("    steps: [{action: press_keys}]\n",
                                         "press_keys needs 'when_app'"),
    "action and steps": ("    action: toggle_mute\n    steps: [{action: toggle_mute}]\n",
                         "needs either 'action' or 'steps', not both"),
    "neither": ("    risk: low\n", "needs either 'action' or 'steps'"),
}


@pytest.mark.parametrize("body, message", BROKEN.values(), ids=BROKEN.keys())
def test_a_broken_entry_is_skipped_with_file_line_and_reason(tmp_path, body, message):
    entry = "  - id: bad\n" + (body if "patterns" in body else "    patterns: [oops]\n" + body)
    write(tmp_path, "core.yaml", command_file(GOOD, entry))
    library = CommandFiles(tmp_path).library
    assert [c.id for c in library.commands] == ["hello"]  # the good entry still loads
    [problem] = library.problems
    assert problem.startswith("core.yaml:5: command 'bad': ")
    assert message in problem


def test_problems_are_logged_as_warnings(tmp_path, caplog):
    write(tmp_path, "core.yaml", command_file("  - id: bad\n    patterns: [x]\n    acton: y\n"))
    with caplog.at_level(logging.WARNING, logger="intent"):
        CommandFiles(tmp_path)
    assert "core.yaml:2: command 'bad': unknown key 'acton'" in caplog.text


def test_files_load_in_name_order(tmp_path):
    write(tmp_path, "media.yaml", command_file(GOOD.replace("hello", "m")))
    write(tmp_path, "browser.yaml", command_file(GOOD.replace("hello", "b")))
    write(tmp_path, "notes.txt", "not a command file")
    assert ids(CommandFiles(tmp_path)) == ["b", "m"]


def test_a_duplicate_id_keeps_the_first_and_names_both_places(tmp_path):
    write(tmp_path, "a.yaml", command_file(GOOD))
    write(tmp_path, "b.yaml", command_file(GOOD))
    files = CommandFiles(tmp_path)
    assert [c.file for c in files.library.commands] == ["a.yaml"]
    assert files.library.problems == (
        "b.yaml:2: command 'hello': already defined at a.yaml:2; skipped",)


def test_a_duplicate_target_keeps_the_first(tmp_path):
    write(tmp_path, "a.yaml", "targets:\n  google: {home: 'https://a'}\n")
    write(tmp_path, "b.yaml", "targets:\n  google: {home: 'https://b'}\n")
    library = CommandFiles(tmp_path).library
    assert library.targets["google"]["home"] == "https://a"
    assert library.problems == ("b.yaml:2: target 'google': already defined at a.yaml:2; skipped",)


def test_a_default_pointing_at_no_target_is_skipped(tmp_path):
    write(tmp_path, "core.yaml", "defaults:\n  search: gogle\n")
    library = CommandFiles(tmp_path).library
    assert library.defaults == {}
    assert library.problems == ("core.yaml:2: default 'search': no target named 'gogle'; skipped",)


def test_a_scalar_entry_reports_its_own_line(tmp_path):
    # a default or alias is one line; its warning names that line, not the section's first
    write(tmp_path, "core.yaml", "targets:\n  google: {home: 'https://g'}\n"
                                 "defaults:\n  search: google\n  play: nowhere\n")
    assert CommandFiles(tmp_path).library.problems == (
        "core.yaml:5: default 'play': no target named 'nowhere'; skipped",)


def test_an_empty_section_is_reported_and_the_rest_still_loads(tmp_path):
    # "commands:" with nothing after it: a half-typed save
    write(tmp_path, "a.yaml", command_file(GOOD))
    write(tmp_path, "core.yaml", "commands:\n")
    files = CommandFiles(tmp_path)
    assert ids(files) == ["hello"]
    [problem] = files.library.problems
    assert problem.startswith("core.yaml:1: commands:")


def test_a_deleted_file_is_forgotten(tmp_path):
    # re-created broken later, it must not bring back its old commands
    path = write(tmp_path, "a.yaml", command_file(GOOD))
    files = CommandFiles(tmp_path)
    path.unlink()
    files.reload_if_changed()
    path.write_text("commands: [\n", encoding="utf-8")
    files.reload_if_changed()
    assert ids(files) == []
    [problem] = files.library.problems
    assert not problem.endswith("; using the last good version")


def test_an_unknown_section_is_reported(tmp_path):
    write(tmp_path, "core.yaml", "comands:\n" + GOOD)
    assert CommandFiles(tmp_path).library.problems == ("core.yaml:1: unknown section 'comands'",)


def test_a_broken_file_seen_first_loads_nothing_and_says_why(tmp_path):
    write(tmp_path, "core.yaml", "commands: [\n")
    library = CommandFiles(tmp_path).library
    assert library.commands == ()
    [problem] = library.problems
    assert problem.startswith("core.yaml: not valid YAML")


@pytest.mark.parametrize("broken", ["commands: [\n", "commands: []\ncommands: []\n", "- a list\n"],
                         ids=["bad YAML", "duplicate key", "not a mapping"])
def test_a_file_broken_later_keeps_its_last_good_version(tmp_path, broken):
    path = write(tmp_path, "core.yaml", command_file(GOOD))
    files = CommandFiles(tmp_path)
    path.write_text(broken, encoding="utf-8")
    assert files.reload_if_changed()
    assert ids(files) == ["hello"]
    [problem] = files.library.problems
    assert problem.endswith("; using the last good version")


def test_nothing_changed_means_no_reload(tmp_path):
    write(tmp_path, "core.yaml", command_file(GOOD))
    files = CommandFiles(tmp_path)
    before = files.library
    assert files.reload_if_changed() is False
    assert files.library is before


def test_an_edited_file_is_reloaded(tmp_path):
    path = write(tmp_path, "core.yaml", command_file(GOOD))
    files = CommandFiles(tmp_path)
    path.write_text(command_file(GOOD.replace("hello", "goodbye")), encoding="utf-8")
    assert files.reload_if_changed()
    assert ids(files) == ["goodbye"]


def test_a_new_file_is_added_and_a_deleted_file_is_dropped(tmp_path):
    first = write(tmp_path, "a.yaml", command_file(GOOD))
    files = CommandFiles(tmp_path)
    write(tmp_path, "b.yaml", command_file(GOOD.replace("hello", "extra")))
    assert files.reload_if_changed()
    assert ids(files) == ["hello", "extra"]
    first.unlink()
    assert files.reload_if_changed()
    assert ids(files) == ["extra"]


def test_a_reload_swaps_in_a_new_library_and_leaves_the_old_one_whole(tmp_path):
    # a reader holding the old library (another thread) never sees a half-loaded one
    path = write(tmp_path, "core.yaml", command_file(GOOD))
    files = CommandFiles(tmp_path)
    old = files.library
    path.write_text(command_file(GOOD, GOOD.replace("hello", "two")), encoding="utf-8")
    files.reload_if_changed()
    assert [c.id for c in old.commands] == ["hello"]
    assert ids(files) == ["hello", "two"]
    with pytest.raises(AttributeError):
        old.commands = ()  # frozen


def test_a_missing_folder_gives_an_empty_library(tmp_path):
    library = CommandFiles(tmp_path / "nowhere").library
    assert (library.commands, library.problems) == ((), ())
