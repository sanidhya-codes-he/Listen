# tests for loading agent/settings.yaml
from dataclasses import FrozenInstanceError

import pytest

from listen_agent.core.paths import AGENT_DIR, LOG_DIR, SETTINGS_FILE
from listen_agent.core.settings import Settings, SettingsError, load_settings


def write(tmp_path, text, encoding="utf-8"):
    path = tmp_path / "settings.yaml"
    path.write_text(text, encoding=encoding)
    return path


def test_paths_point_into_the_agent_folder():
    assert (AGENT_DIR / "pyproject.toml").exists()
    assert SETTINGS_FILE == AGENT_DIR / "settings.yaml"
    assert LOG_DIR == AGENT_DIR / "logs"


def test_defaults_are_the_spec_values():
    settings = Settings()
    assert settings.mode == "wake"
    assert settings.hotkeys.push_to_talk == "ctrl+alt+space"
    assert settings.hotkeys.continuous_toggle == "ctrl+alt+c"
    t = settings.thresholds
    assert (t.hearing, t.match, t.high_risk_hearing, t.high_risk_match, t.continuous_extra) == (
        0.60,
        0.75,
        0.75,
        0.90,
        0.10,
    )


def test_missing_file_gives_defaults(tmp_path):
    assert load_settings(tmp_path / "missing.yaml") == Settings()


def test_empty_file_gives_defaults(tmp_path):
    assert load_settings(write(tmp_path, "")) == Settings()


def test_shipped_settings_file_matches_the_defaults():
    assert load_settings(SETTINGS_FILE) == Settings()


def test_partial_file_overrides_only_what_it_names(tmp_path):
    settings = load_settings(write(tmp_path, "thresholds:\n  match: 0.8\n"))
    assert settings.thresholds.match == 0.8
    assert settings.thresholds.hearing == 0.60
    assert settings.mode == "wake"


def test_file_saved_with_bom_loads(tmp_path):
    settings = load_settings(write(tmp_path, "mode: continuous\n", encoding="utf-8-sig"))
    assert settings.mode == "continuous"


@pytest.mark.parametrize(
    ("text", "named"),
    [
        ("mode: shouting\n", "mode"),
        ("thresholds:\n  match: 1.5\n", "thresholds.match"),
        ("thresholds:\n  match: yes\n", "thresholds.match"),
        ("thresholds:\n  match: high\n", "thresholds.match"),
        ("hotkeys:\n  push_to_talk: ''\n", "hotkeys.push_to_talk"),
        ("hotkeys: ctrl+alt+space\n", "hotkeys"),
        ("threshold:\n  match: 0.8\n", "threshold"),
        ("thresholds:\n  mtach: 0.8\n", "thresholds.mtach"),
    ],
)
def test_bad_values_stop_with_a_message_naming_the_key(tmp_path, text, named):
    with pytest.raises(SettingsError) as error:
        load_settings(write(tmp_path, text))
    assert str(error.value).startswith(named)


def test_broken_yaml_is_a_settings_error(tmp_path):
    with pytest.raises(SettingsError, match="not valid YAML"):
        load_settings(write(tmp_path, "mode: [wake\n"))


def test_top_level_list_is_rejected(tmp_path):
    with pytest.raises(SettingsError, match="expected keys"):
        load_settings(write(tmp_path, "- wake\n"))


def test_settings_cannot_be_changed_after_loading():
    with pytest.raises(FrozenInstanceError):
        Settings().mode = "continuous"
