# storage/  - the local SQLite database (Doc 05)

The ONLY writer to %APPDATA%\Listen\listen.db. Tables: commands, usage_daily, continuous_log, app_sessions, meta.
Numbered SQL migrations, WAL mode, the 30-day purge of private tables.
