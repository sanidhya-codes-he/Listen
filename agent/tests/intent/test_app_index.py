# tests for the app index: Start Menu shortcuts -> apps, and spoken names -> apps
from functools import partial
from pathlib import Path

import pytest

from listen_agent.intent import app_index

# no store apps unless a test gives some: the real reader would list this laptop's
AppIndex = partial(app_index.AppIndex, read_store_apps=lambda: {})
LNK_HEADER = b"L\x00\x00\x00" + bytes(72)  # a shortcut file's first 76 bytes start with 4C 00 00 00

NOTEPAD_ID = "Microsoft.WindowsNotepad_8wekyb3d8bbwe!App"


def shortcut(folder, relative, data=LNK_HEADER):
    path = folder / relative
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(data)  # the reader is faked, so only the header matters
    return path


@pytest.fixture
def start_menu(tmp_path):
    user, everyone = tmp_path / "user", tmp_path / "everyone"
    exe = tmp_path / "bin"
    exe.mkdir()
    for name in ("Code.exe", "chrome.exe", "pycharm64.exe", "unins000.exe"):
        (exe / name).write_bytes(b"")
    targets = {
        shortcut(user, "Visual Studio Code/Visual Studio Code.lnk"): str(exe / "Code.exe"),
        shortcut(everyone, "Google Chrome.lnk"): str(exe / "chrome.exe"),
        shortcut(user, "JetBrains/PyCharm.lnk"): str(exe / "pycharm64.exe"),
        shortcut(user, "Uninstall PyCharm.lnk"): str(exe / "unins000.exe"),
        shortcut(everyone, "Old Tool.lnk"): str(exe / "gone.exe"),  # broken: target missing
        shortcut(everyone, "Calculator.lnk"): "",  # store app: no target
        shortcut(everyone, "JetBrains/PyCharm.lnk"): str(exe / "pycharm64.exe"),  # duplicate
    }
    return [user, everyone], (lambda paths: {p: targets[p] for p in paths})


def test_scan_lists_apps_by_shortcut_name(start_menu):
    folders, reader = start_menu
    index = AppIndex(folders, read_targets=reader)
    assert sorted(index.names()) == ["Calculator", "Google Chrome", "PyCharm", "Visual Studio Code"]


def test_apps_keep_their_shortcut_and_target(start_menu):
    folders, reader = start_menu
    app, _ = AppIndex(folders, read_targets=reader).find("google chrome")
    assert app.shortcut.name == "Google Chrome.lnk"
    assert app.target.name == "chrome.exe"


def test_store_apps_without_a_target_are_kept(start_menu):
    folders, reader = start_menu
    app, _ = AppIndex(folders, read_targets=reader).find("calculator")
    assert app.target is None


def test_the_first_folder_wins_when_a_name_appears_twice(start_menu):
    folders, reader = start_menu
    app, _ = AppIndex(folders, read_targets=reader).find("pycharm")
    assert folders[0] in app.shortcut.parents


@pytest.mark.parametrize(
    ("spoken", "expected", "score"),
    [
        ("Google Chrome", "Google Chrome", 1.0),
        ("google chrome", "Google Chrome", 1.0),
        ("  PyCharm ", "PyCharm", 1.0),
        ("vs code", "Visual Studio Code", 1.0),  # alias
        ("goggle chrome", "Google Chrome", None),  # misspelling over 0.8
    ],
)
def test_find_by_name_alias_or_close_misspelling(start_menu, spoken, expected, score):
    folders, reader = start_menu
    index = AppIndex(folders, read_targets=reader, aliases={"vs code": "Visual Studio Code"})
    app, similarity = index.find(spoken)
    assert app.name == expected
    if score is None:
        assert 0.8 <= similarity < 1.0
    else:
        assert similarity == score


@pytest.mark.parametrize(
    "spoken",
    [
        "spotify",  # not installed
        "crome",  # too mangled (0.56)
        "code",  # one word of a longer name (0.36)
        "",  # nothing heard
        "visual code",  # 0.76: just under the line
        "chrome",  # 0.63: refused at 0.8, accepted at 0.6
    ],
)
def test_unknown_or_too_different_names_are_refused(start_menu, spoken):
    folders, reader = start_menu
    assert AppIndex(folders, read_targets=reader).find(spoken) is None


def test_an_alias_to_an_app_that_is_not_installed_finds_nothing(start_menu):
    folders, reader = start_menu
    index = AppIndex(folders, read_targets=reader, aliases={"music": "Spotify"})
    assert index.find("music") is None


def test_aliases_are_cleaned_like_spoken_names(start_menu):
    folders, reader = start_menu
    index = AppIndex(folders, read_targets=reader, aliases={" VS  Code ": "Visual Studio Code"})
    assert index.find("vs code")[0].name == "Visual Studio Code"


def test_the_real_reader_reads_a_real_shortcut(tmp_path):
    # every other test fakes the reader; this one makes a real .lnk (CI runs on Windows too)
    import win32com.client

    from listen_agent.intent.app_index import read_targets

    program = tmp_path / "tool.exe"
    program.write_bytes(b"")
    link = tmp_path / "Tool.lnk"
    made = win32com.client.Dispatch("WScript.Shell").CreateShortcut(str(link))
    made.TargetPath = str(program)
    made.Save()
    assert read_targets([link]) == {link: str(program)}


def test_missing_folders_are_skipped(tmp_path):
    index = AppIndex([tmp_path / "nowhere"], read_targets=lambda paths: {})
    assert index.names() == []


def test_rebuild_picks_up_new_shortcuts(start_menu):
    folders, reader = start_menu
    index = AppIndex(folders, read_targets=lambda paths: {p: "" for p in paths})
    shortcut(folders[0], "Notepad.lnk")
    assert index.find("notepad") is None
    index.rebuild()
    assert index.find("notepad")[0].name == "Notepad"


def test_default_folders_are_the_two_start_menus(monkeypatch, tmp_path):
    monkeypatch.setenv("APPDATA", str(tmp_path / "roaming"))
    monkeypatch.setenv("PROGRAMDATA", str(tmp_path / "programdata"))
    from listen_agent.intent.app_index import start_menu_folders

    assert start_menu_folders() == [
        Path(tmp_path / "roaming/Microsoft/Windows/Start Menu/Programs"),
        Path(tmp_path / "programdata/Microsoft/Windows/Start Menu/Programs"),
    ]


def test_store_apps_are_indexed_with_their_id(start_menu):
    folders, reader = start_menu
    store = {"Notepad": NOTEPAD_ID, "Some Tool": r"{6D809377-6AF0-444B-8957-A3773F02200E}\tool.exe"}
    index = AppIndex(folders, read_targets=reader, read_store_apps=lambda: store)
    app, _ = index.find("notepad")
    assert (app.name, app.app_id, app.shortcut, app.target) == ("Notepad", NOTEPAD_ID, None, None)
    assert "Some Tool" not in index.names()  # not a store app: it arrives through its shortcut


def test_a_shortcut_app_wins_over_a_store_app_with_the_same_name(start_menu):
    folders, reader = start_menu
    store = {"Calculator": "Microsoft.WindowsCalculator_8wekyb3d8bbwe!App"}
    index = AppIndex(folders, read_targets=reader, read_store_apps=lambda: store)
    app, _ = index.find("calculator")
    assert app.app_id is None
    assert app.shortcut.name == "Calculator.lnk"


@pytest.mark.parametrize("data", [b"", b"not a shortcut at all", LNK_HEADER[:40]],
                         ids=["empty", "garbage", "cut short"])
def test_damaged_shortcuts_are_left_out_with_a_warning(start_menu, caplog, data):
    folders, reader = start_menu
    shortcut(folders[0], "Broken.lnk", data)
    index = AppIndex(folders, read_targets=reader)  # the fake reader raises on unknown files
    assert "Broken" not in index.names()
    assert "Visual Studio Code" in index.names()  # the good ones still load
    assert [r.getMessage() for r in caplog.records] == ["damaged shortcut skipped: Broken.lnk"]


def test_the_real_store_reader_lists_apps_by_name():
    # CI runs on Windows too; a fresh runner has fewer store apps than a laptop, so no "!" check
    store = app_index.read_store_apps()
    assert store
    assert all(isinstance(name, str) and isinstance(app_id, str) for name, app_id in store.items())
