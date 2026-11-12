# tests for the real Windows layer: why a launch failed (CI runs on Windows too)
import pytest

from listen_agent.actions import windows
from listen_agent.actions.registry import ActionError, AppNotInstalledError


@pytest.mark.parametrize("gone", [
    "Gone.lnk", r"shell:AppsFolder\Listen.NoSuchApp_8wekyb3d8bbwe!App"], ids=["shortcut", "store"])
def test_launching_an_app_that_is_gone_says_it_is_not_installed(tmp_path, gone):
    # real ShellExecuteExW, code 2; Windows' own error box is off, or this would wait for a click
    target = tmp_path / gone if gone.endswith(".lnk") else gone
    with pytest.raises(AppNotInstalledError, match="isn't installed any more"):
        windows.WindowsSystem(apps=None).launch(target)


@pytest.mark.parametrize(("code", "message"), [
    (2, "the app isn't installed any more"), (3, "the app isn't installed any more"),
    (5, "Windows blocked the app"), (1260, "Windows blocked the app"),
    (1223, "starting the app was cancelled"), (8, "the app could not be started")])
def test_each_windows_error_code_says_why(code, message):
    # 5, 1260 and 1223 can't be caused safely in a test: the mapping is checked on its own
    error = windows.launch_error(code)
    assert isinstance(error, ActionError)
    assert str(error) == message
    assert isinstance(error, AppNotInstalledError) == (code in (2, 3))  # only "gone" rebuilds
