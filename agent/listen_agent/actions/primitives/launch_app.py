# launch_app: start an installed app; returns its process id (for undo), None if Windows gives none
from listen_agent.actions.apps import installed_app
from listen_agent.actions.registry import primitive


@primitive("launch_app", params={"app": str})
def launch_app(system, app):
    found = installed_app(system, app)
    # a store app has no shortcut: Windows starts it by its AppUserModelID
    return system.launch(rf"shell:AppsFolder\{found.app_id}" if found.app_id else found.shortcut)
