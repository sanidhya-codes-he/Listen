# tests for the strict YAML loader shared by settings and (later) command files
import pytest

from listen_agent.core.yamlfile import YamlFileError, load_yaml


def write(tmp_path, text, name="settings.yaml", encoding="utf-8"):
    path = tmp_path / name
    path.write_text(text, encoding=encoding)
    return path


def test_valid_file_loads_as_usual(tmp_path):
    data = load_yaml(write(tmp_path, "mode: wake\nthresholds:\n  match: 0.8\n"))
    assert data == {"mode": "wake", "thresholds": {"match": 0.8}}


def test_empty_file_gives_none(tmp_path):
    assert load_yaml(write(tmp_path, "")) is None


def test_duplicate_top_level_key_names_file_line_and_key(tmp_path):
    path = write(tmp_path, "mode: wake\nhotkeys: {}\nmode: continuous\n")
    with pytest.raises(YamlFileError) as error:
        load_yaml(path)
    assert str(error.value) == "settings.yaml:3: duplicate key 'mode'"


def test_duplicate_inside_a_section_is_refused(tmp_path):
    path = write(tmp_path, "thresholds:\n  match: 0.8\n  hearing: 0.6\n  match: 0.9\n")
    with pytest.raises(YamlFileError) as error:
        load_yaml(path)
    assert str(error.value) == "settings.yaml:4: duplicate key 'match'"


def test_same_key_in_different_sections_is_fine(tmp_path):
    data = load_yaml(write(tmp_path, "a:\n  name: x\nb:\n  name: y\n"))
    assert data == {"a": {"name": "x"}, "b": {"name": "y"}}


def test_duplicates_are_found_in_lists_of_mappings(tmp_path):
    # command files are lists of entries; each entry must be checked too
    path = write(tmp_path, "commands:\n  - id: open\n    id: close\n", name="core.yaml")
    with pytest.raises(YamlFileError, match=r"^core\.yaml:3: duplicate key 'id'$"):
        load_yaml(path)


def test_broken_yaml_is_a_yamlfile_error(tmp_path):
    with pytest.raises(YamlFileError, match=r"^settings\.yaml: not valid YAML"):
        load_yaml(write(tmp_path, "mode: [wake\n"))


def test_unreadable_file_is_a_yamlfile_error(tmp_path):
    (tmp_path / "settings.yaml").mkdir()
    with pytest.raises(YamlFileError, match=r"^settings\.yaml: can't read it .*save it as UTF-8$"):
        load_yaml(tmp_path / "settings.yaml")


def test_file_in_another_encoding_is_a_yamlfile_error(tmp_path):
    path = write(tmp_path, "# café\nmode: wake\n", encoding="cp1252")
    with pytest.raises(YamlFileError, match="save it as UTF-8"):
        load_yaml(path)


def test_missing_file_is_an_error_not_empty(tmp_path):
    with pytest.raises(YamlFileError, match="can't read it"):
        load_yaml(tmp_path / "missing.yaml")
