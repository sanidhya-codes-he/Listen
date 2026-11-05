# launch_app: start an installed app; returns its process id (for undo), None if Windows gives none
from listen_agent.actions.apps import installed_app
from listen_agent.actions.registry import primitive


@primitive("launch_app", params={"app": str})
def launch_app(system, app):
    return system.launch(installed_app(system, app).shortcut)
