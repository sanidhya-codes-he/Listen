# close_app: close a running app politely, like clicking X on each of its windows
from listen_agent.actions.apps import app_windows
from listen_agent.actions.registry import primitive


@primitive("close_app", params={"app": str})
def close_app(system, app):
    windows = app_windows(system, app)
    for window in windows:
        system.close_window(window)
    return len(windows)
