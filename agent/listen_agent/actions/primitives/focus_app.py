# focus_app: bring a running app's first window to the front
from listen_agent.actions.apps import app_windows
from listen_agent.actions.registry import primitive


@primitive("focus_app", params={"app": str})
def focus_app(system, app):
    system.focus_window(app_windows(system, app)[0])
